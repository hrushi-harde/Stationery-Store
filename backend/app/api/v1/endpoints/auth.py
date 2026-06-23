from datetime import datetime, timedelta, timezone
import hashlib
import secrets

from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password, verify_password
from app.core.database import get_db
from app.models import RefreshToken, User
from app.schemas.user import (
    LoginRequest,
    LogoutResponse,
    RegisterRequest,
    TokenPairResponse,
    UserOut,
)

router = APIRouter()
bearer_scheme = HTTPBearer(auto_error=False)


def _hash_refresh_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _create_access_token(user: User) -> tuple[str, int]:
    expires_delta = timedelta(minutes=settings.access_token_expire_minutes)
    expires_at = datetime.now(timezone.utc) + expires_delta

    payload = {
        "sub": str(user.id),
        "email": user.email,
        "type": "access",
        "iss": settings.jwt_issuer,
        "iat": int(datetime.now(timezone.utc).timestamp()),
        "exp": int(expires_at.timestamp()),
    }

    token = jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)
    return token, int(expires_delta.total_seconds())


def _issue_refresh_token(user_id: int, db: Session) -> str:
    raw_token = secrets.token_urlsafe(48)
    token_hash = _hash_refresh_token(raw_token)
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)

    record = RefreshToken(
        user_id=user_id,
        token_hash=token_hash,
        expires_at=expires_at,
        revoked=False,
    )
    db.add(record)
    db.flush()

    return raw_token


def _build_user_out(user: User) -> UserOut:
    return UserOut(
        id=user.id,
        name=user.name,
        email=user.email,
        role="owner" if user.email == settings.shop_owner_email else "customer",
    )


def _build_token_pair(user: User, db: Session) -> tuple[str, str, int]:
    access_token, expires_in = _create_access_token(user)
    refresh_token = _issue_refresh_token(user.id, db)
    return access_token, refresh_token, expires_in


def _decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.algorithm],
            issuer=settings.jwt_issuer,
        )
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
        ) from exc

    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
        )

    return payload


def _get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if not credentials or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing access token")

    payload = _decode_access_token(credentials.credentials)
    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    return user


@router.post("/register", response_model=TokenPairResponse, response_model_exclude_none=True)
def register(payload: RegisterRequest, db: Session = Depends(get_db), response: Response = None) -> TokenPairResponse:
    normalized_email = payload.email.strip().lower()
    existing = db.query(User).filter(User.email == normalized_email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(
        name=payload.name.strip(),
        email=normalized_email,
        password_hash=hash_password(payload.password),
    )

    db.add(user)
    db.flush()

    access_token, refresh_token, expires_in = _build_token_pair(user, db)
    db.commit()

    # Set refresh token as HttpOnly cookie
    secure_flag = settings.app_env == "production"
    max_age = int(timedelta(days=settings.refresh_token_expire_days).total_seconds())
    if response is not None:
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=secure_flag,
            samesite="lax",
            max_age=max_age,
            expires=max_age,
            path="/",
        )

    return TokenPairResponse(
        access_token=access_token,
        refresh_token=None,
        expires_in=expires_in,
        user=_build_user_out(user),
    )

@router.post("/login", response_model=TokenPairResponse, response_model_exclude_none=True)
def login(payload: LoginRequest, db: Session = Depends(get_db), response: Response = None) -> TokenPairResponse:
    normalized_email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == normalized_email).first()

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    access_token, refresh_token, expires_in = _build_token_pair(user, db)
    db.commit()

    secure_flag = settings.app_env == "production"
    max_age = int(timedelta(days=settings.refresh_token_expire_days).total_seconds())
    if response is not None:
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=secure_flag,
            samesite="lax",
            max_age=max_age,
            expires=max_age,
            path="/",
        )

    return TokenPairResponse(
        access_token=access_token,
        refresh_token=None,
        expires_in=expires_in,
        user=_build_user_out(user),
    )


@router.post("/refresh", response_model=TokenPairResponse, response_model_exclude_none=True)
def refresh_tokens(request: Request = None, response: Response = None, db: Session = Depends(get_db)) -> TokenPairResponse:
    raw_refresh = None
    try:
        raw_refresh = (request.cookies or {}).get("refresh_token")
    except Exception:
        raw_refresh = None

    if not raw_refresh:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing refresh token")

    token_hash = _hash_refresh_token(raw_refresh)
    token_record = (
        db.query(RefreshToken)
        .filter(RefreshToken.token_hash == token_hash)
        .first()
    )

    if not token_record or token_record.revoked:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    if token_record.expires_at < datetime.now(timezone.utc):
        token_record.revoked = True
        db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token expired")

    user = db.query(User).filter(User.id == token_record.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    new_refresh_token = _issue_refresh_token(user.id, db)
    token_record.revoked = True
    token_record.replaced_by_hash = _hash_refresh_token(new_refresh_token)

    access_token, expires_in = _create_access_token(user)
    db.commit()

    # Set cookie to new refresh token
    secure_flag = settings.app_env == "production"
    max_age = int(timedelta(days=settings.refresh_token_expire_days).total_seconds())
    if response is not None:
        response.set_cookie(
            key="refresh_token",
            value=new_refresh_token,
            httponly=True,
            secure=secure_flag,
            samesite="lax",
            max_age=max_age,
            expires=max_age,
            path="/",
        )

    return TokenPairResponse(
        access_token=access_token,
        refresh_token=None,
        expires_in=expires_in,
        user=_build_user_out(user),
    )


@router.post("/logout")
def logout(request: Request = None, response: Response = None, db: Session = Depends(get_db)) -> LogoutResponse:
    raw_refresh = None
    try:
        raw_refresh = (request.cookies or {}).get("refresh_token")
    except Exception:
        raw_refresh = None

    if raw_refresh:
        token_hash = _hash_refresh_token(raw_refresh)
        token_record = (
            db.query(RefreshToken)
            .filter(RefreshToken.token_hash == token_hash)
            .first()
        )

        if token_record and not token_record.revoked:
            token_record.revoked = True
            db.commit()

    # clear cookie
    if response is not None:
        response.delete_cookie("refresh_token", path="/")

    return LogoutResponse(status="ok")


@router.get("/me")
def me(current_user: User = Depends(_get_current_user)) -> UserOut:
    return _build_user_out(current_user)


def _require_owner(current_user: User = Depends(_get_current_user)) -> User:
    if current_user.email != settings.shop_owner_email:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Owner access required")
    return current_user
