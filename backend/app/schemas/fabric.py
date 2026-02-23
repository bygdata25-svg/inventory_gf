from pydantic import BaseModel


class FabricCreate(BaseModel):
    name: str
    color: str

    # legacy (optional)
    composition: str | None = None

    # new real-world fields
    width_m: float | None = None
    length_m: float | None = None
    fabric_type: str | None = None
    weave: str | None = None
    finish: str | None = None  # "LISO" / "BORDADO"
    price_per_meter: float | None = None


class FabricUpdate(BaseModel):
    name: str | None = None
    color: str | None = None

    composition: str | None = None

    width_m: float | None = None
    length_m: float | None = None
    fabric_type: str | None = None
    weave: str | None = None
    finish: str | None = None
    price_per_meter: float | None = None


class FabricOut(BaseModel):
    id: int
    code: str
    name: str | None = None
    color: str | None = None

    composition: str | None = None

    width_m: float | None = None
    length_m: float | None = None
    fabric_type: str | None = None
    weave: str | None = None
    finish: str | None = None
    price_per_meter: float | None = None

    # keep this because fabrics have is_active in the DB/model
    is_active: bool | None = None

    class Config:
        from_attributes = True

