from __future__ import annotations

from datetime import datetime
from enum import Enum

from sqlalchemy import String, Integer, DateTime, ForeignKey, Text, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class LoanStatus(str, Enum):
    OPEN = "OPEN"
    RETURNED = "RETURNED"
    CANCELLED = "CANCELLED"


class DressLoan(Base):
    __tablename__ = "dress_loans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    dress_id: Mapped[int] = mapped_column(ForeignKey("dresses.id"), index=True)

    customer_name: Mapped[str] = mapped_column(String(120))
    customer_dni: Mapped[str | None] = mapped_column(String(30), nullable=True)
    customer_phone: Mapped[str | None] = mapped_column(String(40), nullable=True)
    customer_email: Mapped[str | None] = mapped_column(String(120), nullable=True)

    event_name: Mapped[str | None] = mapped_column(String(160), nullable=True)

    delivered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, index=True)
    due_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    loan_days: Mapped[int | None] = mapped_column(Integer, nullable=True)

    delivered_by_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    picked_up_by: Mapped[str | None] = mapped_column(String(120), nullable=True)

    returned_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    returned_by: Mapped[str | None] = mapped_column(String(120), nullable=True)
    received_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)

    status: Mapped[LoanStatus] = mapped_column(SAEnum(LoanStatus), default=LoanStatus.OPEN, index=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    dress = relationship("Dress", back_populates="loans")
