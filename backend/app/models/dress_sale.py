from datetime import datetime
from sqlalchemy import Integer, ForeignKey, DateTime, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.db.session import Base

class DressSale(Base):
    __tablename__ = "dress_sales"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    dress_id: Mapped[int] = mapped_column(ForeignKey("dresses.id"), index=True)
    sold_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    sold_price: Mapped[float] = mapped_column(Numeric(12, 2))
    buyer_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    sold_by_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
