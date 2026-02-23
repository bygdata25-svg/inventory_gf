from pydantic import BaseModel, Field


class RollCreate(BaseModel):
    fabric_id: int
    supplier_id: int

    lot_number: str | None = Field(default=None, max_length=80)
    location: str | None = Field(default=None, max_length=80)

    meters_initial: int = Field(ge=0, le=1_000_000)
    meters_available: int | None = Field(default=None, ge=0, le=1_000_000)


class RollUpdate(BaseModel):
    supplier_id: int | None = None
    lot_number: str | None = Field(default=None, max_length=80)
    location: str | None = Field(default=None, max_length=80)

    meters_available: int | None = Field(default=None, ge=0, le=1_000_000)
    is_active: bool | None = None


class RollOut(BaseModel):
    id: int
    fabric_id: int
    supplier_id: int

    lot_number: str | None
    location: str | None
    meters_initial: int
    meters_available: int
    is_active: bool

    # Fabric (joined)
    fabric_code: str
    fabric_name: str | None = None
    fabric_color: str | None = None
    fabric_type: str | None = None          # <- this is Fabric.fabric_type
    fabric_width_m: float | None = None

    # Supplier (joined)
    supplier_name: str | None = None

    class Config:
        from_attributes = True

