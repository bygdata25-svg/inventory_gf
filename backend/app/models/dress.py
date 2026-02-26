from __future__ import annotations

from datetime import datetime
from enum import Enum

from sqlalchemy import String, Integer, DateTime, Text, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class DressStatus(str, Enum):
    AVAILABLE = "AVAILABLE"
    LOANED = "LOANED"
    CLEANING = "CLEANING"
    MAINTENANCE = "MAINTENANCE"
    RETIRED = "RETIRED"


class Dress(Base):
    __tablename__ = "dresses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120))
    size: Mapped[str | None] = mapped_column(String(20), nullable=True)
    color: Mapped[str | None] = mapped_column(String(40), nullable=True)
    status: Mapped[DressStatus] = mapped_column(SAEnum(DressStatus), default=DressStatus.AVAILABLE, index=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    loans: Mapped[list["DressLoan"]] = relationship(back_populates="dress")
