from pydantic import BaseModel, Field
from datetime import datetime

class StockMovementCreate(BaseModel):
    roll_id: int
    movement_type: str = Field(pattern="^(IN|OUT|ADJUST)$")
    meters: int = Field(ge=1, le=1_000_000)
    reason: str | None = Field(default=None, max_length=200)
    reference: str | None = Field(default=None, max_length=80)

class StockMovementOut(BaseModel):
    id: int
    roll_id: int
    movement_type: str
    meters: int
    reason: str | None
    reference: str | None
    created_at: datetime

    # roll snapshot (joined)
    roll_meters_available: int
    fabric_code: str

    class Config:
        from_attributes = True

