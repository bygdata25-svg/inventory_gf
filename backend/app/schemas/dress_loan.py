from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from app.models.dress_loan import LoanStatus


class LoanCreate(BaseModel):
    dress_id: int

    customer_name: str
    customer_dni: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_email: Optional[EmailStr] = None

    event_name: Optional[str] = None

    loan_days: Optional[int] = Field(default=None, ge=1, le=60)
    due_at: Optional[datetime] = None

    picked_up_by: Optional[str] = None
    notes: Optional[str] = None


class LoanReturn(BaseModel):
    returned_by: Optional[str] = None

class LoanOut(BaseModel):
    id: int
    dress_id: int
    customer_name: str
    customer_dni: str | None = None
    customer_phone: str | None = None
    customer_email: EmailStr | None = None
    event_name: str | None = None
    delivered_at: datetime
    due_at: datetime
    returned_at: datetime | None = None
    loan_days: int | None = None
    picked_up_by: str | None = None
    notes: str | None = None
    status: LoanStatus
    returned_by: str | None = None
    dress_name: str | None = None

    model_config = {"from_attributes": True}

    class Config:
        from_attributes = True
