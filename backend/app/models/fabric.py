from sqlalchemy import Integer, String, Numeric, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base


class Fabric(Base):
    __tablename__ = "fabrics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # 0001, 0002, 0003...
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)

    # Real fields
    name: Mapped[str | None] = mapped_column(String(120), nullable=True)  # NOMBRE
    color: Mapped[str] = mapped_column(String(80), nullable=False)

    width_m: Mapped[float | None] = mapped_column(Numeric(10, 3), nullable=True)   # ANCHO en metros
    length_m: Mapped[float | None] = mapped_column(Numeric(10, 3), nullable=True)  # LARGO en metros

    fabric_type: Mapped[str | None] = mapped_column(String(80), nullable=True)  # tipo de género
    weave: Mapped[str | None] = mapped_column(String(80), nullable=True)        # ligamento
    finish: Mapped[str | None] = mapped_column(String(80), nullable=True)       # BORDADO / LISO

    price_per_meter: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # ✅ Relationships
    rolls = relationship("Roll", back_populates="fabric")
