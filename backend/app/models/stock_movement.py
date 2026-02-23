from datetime import datetime
from sqlalchemy import Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base

class StockMovement(Base):
    __tablename__ = "stock_movements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    roll_id: Mapped[int] = mapped_column(ForeignKey("rolls.id"), nullable=False, index=True)

    # IN, OUT, ADJUST
    movement_type: Mapped[str] = mapped_column(String(10), nullable=False)

    # meters are always positive in the movement record
    meters: Mapped[int] = mapped_column(Integer, nullable=False)

    reason: Mapped[str | None] = mapped_column(String(200), nullable=True)
    reference: Mapped[str | None] = mapped_column(String(80), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), default=datetime.utcnow, nullable=False)

    roll = relationship("Roll", lazy="joined")

