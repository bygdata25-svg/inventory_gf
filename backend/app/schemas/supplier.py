from typing import Optional
from pydantic import BaseModel, EmailStr

class SupplierCreate(BaseModel):
    name: str
    phone: Optional[str] = None        # ✅ sin regex
    email: Optional[EmailStr] = None   # ✅ valida formato
    address: Optional[str] = None      # ✅ nuevo
    notes: Optional[str] = None
    is_active: bool = True

class SupplierOut(BaseModel):
    id: int
    name: str
    phone: Optional[str]
    email: Optional[EmailStr]
    address: Optional[str]
    notes: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True

