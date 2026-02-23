from pydantic import BaseModel

class StockByFabricRow(BaseModel):
    fabric_id: int
    code: str
    name: str | None = None
    color: str | None = None
    fabric_type: str | None = None
    weave: str | None = None
    finish: str | None = None

    supplier_id: int | None = None
    supplier_name: str | None = None

    rolls_count: int
    meters_available_total: float
    estimated_value: float

