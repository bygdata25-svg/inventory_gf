from pydantic import BaseModel

class SupplierCreate(BaseModel):
    name: str
    phone: str | None = None
    email: str | None = None
    notes: str | None = None
    is_active: bool = True

class SupplierOut(BaseModel):
    id: int
    name: str
    phone: str | None = None
    email: str | None = None
    notes: str | None = None
    is_active: bool

    class Config:
        from_attributes = True

