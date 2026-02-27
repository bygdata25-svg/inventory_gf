from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, func
from app.db.session import Base

class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True, index=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=False), nullable=False, server_default=func.now())
    address: Mapped[str | None] = mapped_column(Text, nullable=True)

