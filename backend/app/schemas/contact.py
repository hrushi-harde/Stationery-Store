from datetime import datetime

from pydantic import BaseModel, Field


class ContactRequestCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: str = Field(min_length=3, max_length=200)
    subject: str = Field(default="", max_length=200)
    message: str = Field(min_length=1, max_length=4000)


class ContactRequestOut(BaseModel):
    id: int
    name: str
    email: str
    subject: str
    message: str
    status: str = "under_review"
    created_at: datetime


class ContactStatusUpdate(BaseModel):
    status: str = Field(pattern="^(under_review|received|ignored)$")


class ContactRequestListResponse(BaseModel):
    items: list[ContactRequestOut]
    total: int
    status_counts: dict[str, int] = Field(default_factory=dict)
    page: int = 1
    limit: int = 5
    total_pages: int = 1
