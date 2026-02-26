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
    customer_dni: Optional[str]
    customer_phone: Optional[str]
    customer_email: Optional[str]
    event_name: Optional[str]

    delivered_at: datetime
    due_at: datetime
    loan_days: Optional[int]

    delivered_by_user_id: int
    picked_up_by: Optional[str]

    returned_at: Optional[datetime]
    returned_by: Optional[str]
    received_by_user_id: Optional[int]

    status: LoanStatus
    notes: Optional[str]

    class Config:
        from_attributes = True
