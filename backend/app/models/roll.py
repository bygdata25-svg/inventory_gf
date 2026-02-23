from sqlalchemy import Integer, String, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base

class Roll(Base):
    __tablename__ = "rolls"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    fabric_id: Mapped[int] = mapped_column(ForeignKey("fabrics.id"), nullable=False, index=True)

    # ✅ Supplier now depends on the roll (batch / purchase)
    supplier_id: Mapped[int] = mapped_column(ForeignKey("suppliers.id"), nullable=False, index=True)

    lot_number: Mapped[str | None] = mapped_column(String(80), nullable=True)
    location: Mapped[str | None] = mapped_column(String(80), nullable=True)

    meters_initial: Mapped[int] = mapped_column(Integer, nullable=False)
    meters_available: Mapped[int] = mapped_column(Integer, nullable=False)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    fabric = relationship("Fabric", back_populates="rolls", lazy="joined")
    supplier = relationship("Supplier", lazy="joined")

