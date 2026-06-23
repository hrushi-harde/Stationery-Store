from pydantic import BaseModel


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str = "customer"


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenPairResponse(BaseModel):
    access_token: str
    refresh_token: str | None = None
    token_type: str = "bearer"
    expires_in: int
    user: UserOut


class LogoutResponse(BaseModel):
    status: str
