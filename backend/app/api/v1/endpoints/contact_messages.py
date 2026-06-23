from email.message import EmailMessage
import smtplib

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.api.v1.endpoints.auth import _require_owner
from app.core.config import settings
from app.core.database import get_db
from app.models import ContactMessage
from app.schemas.contact import (
    ContactRequestCreate,
    ContactRequestListResponse,
    ContactRequestOut,
    ContactStatusUpdate,
)

router = APIRouter()


def _to_contact_out(contact_message: ContactMessage) -> ContactRequestOut:
    return ContactRequestOut(
        id=contact_message.id,
        name=contact_message.name,
        email=contact_message.email,
        subject=contact_message.subject or "",
        message=contact_message.message,
        status=contact_message.status,
        created_at=contact_message.created_at,
    )


def _send_owner_notification(contact_message: ContactMessage) -> None:
    smtp_host = settings.contact_smtp_host.strip()
    smtp_user = settings.contact_smtp_user.strip()
    smtp_password = settings.contact_smtp_password.strip()
    recipient_email = settings.contact_notification_email.strip() or settings.shop_owner_email.strip()

    if not smtp_host or not smtp_user or not smtp_password or not recipient_email:
        return

    email_message = EmailMessage()
    email_message["Subject"] = f"New contact request from {contact_message.name}"
    email_message["From"] = smtp_user
    email_message["To"] = recipient_email
    email_message["Reply-To"] = contact_message.email
    email_message.set_content(
        """A new contact request was submitted from the stationery store.

Name: {name}
Email: {email}
Subject: {subject}
Message:
{message}
""".format(
            name=contact_message.name,
            email=contact_message.email,
            subject=contact_message.subject or "No subject",
            message=contact_message.message,
        )
    )

    try:
        if settings.contact_smtp_use_tls:
            with smtplib.SMTP(smtp_host, settings.contact_smtp_port) as smtp:
                smtp.ehlo()
                smtp.starttls()
                smtp.ehlo()
                smtp.login(smtp_user, smtp_password)
                smtp.send_message(email_message)
        else:
            with smtplib.SMTP_SSL(smtp_host, settings.contact_smtp_port) as smtp:
                smtp.login(smtp_user, smtp_password)
                smtp.send_message(email_message)
    except Exception:
        return


@router.post("")
def create_contact_request(
    payload: ContactRequestCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
) -> ContactRequestOut:
    contact_message = ContactMessage(
        name=payload.name.strip(),
        email=payload.email.strip(),
        subject=payload.subject.strip(),
        message=payload.message.strip(),
    )
    db.add(contact_message)
    db.commit()
    db.refresh(contact_message)

    background_tasks.add_task(_send_owner_notification, contact_message)

    return _to_contact_out(contact_message)


@router.get("/admin", dependencies=[Depends(_require_owner)])
def list_contact_requests(
    page: int = 1,
    limit: int = 5,
    db: Session = Depends(get_db)
) -> ContactRequestListResponse:
    # Validate pagination parameters
    page = max(1, page)
    limit = max(1, min(100, limit))  # Limit between 1 and 100
    
    # Get total count
    total = db.query(ContactMessage).count()

    status_counts = {
        "under_review": db.query(ContactMessage).filter(ContactMessage.status == "under_review").count(),
        "received": db.query(ContactMessage).filter(ContactMessage.status == "received").count(),
        "ignored": db.query(ContactMessage).filter(ContactMessage.status == "ignored").count(),
    }
    
    # Calculate skip
    skip = (page - 1) * limit
    
    # Get paginated rows
    rows = (
        db.query(ContactMessage)
        .order_by(desc(ContactMessage.created_at), desc(ContactMessage.id))
        .offset(skip)
        .limit(limit)
        .all()
    )
    
    # Calculate total pages
    total_pages = (total + limit - 1) // limit
    
    return ContactRequestListResponse(
        items=[_to_contact_out(row) for row in rows],
        total=total,
        status_counts=status_counts,
        page=page,
        limit=limit,
        total_pages=total_pages
    )


@router.patch("/{message_id}/status", dependencies=[Depends(_require_owner)])
def update_contact_status(
    message_id: int,
    payload: ContactStatusUpdate,
    db: Session = Depends(get_db),
) -> ContactRequestOut:
    message = db.query(ContactMessage).filter(ContactMessage.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Contact message not found")
    
    message.status = payload.status
    db.add(message)
    db.commit()
    db.refresh(message)
    
    return _to_contact_out(message)


@router.delete("/{message_id}", dependencies=[Depends(_require_owner)])
def delete_contact_request(
    message_id: int,
    db: Session = Depends(get_db),
) -> dict:
    message = db.query(ContactMessage).filter(ContactMessage.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Contact message not found")

    db.delete(message)
    db.commit()

    return {"detail": "Contact message deleted successfully"}
