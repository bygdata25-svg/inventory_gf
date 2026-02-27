from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class DressSaleCreate(BaseModel):
    dress_id: int
    sold_price: float = Field(gt=0)
    buyer_name: Optional[str] = None
    notes: Optional[str] = None

class DressSaleOut(BaseModel):
    id: int
    dress_id: int
    sold_at: datetime
    sold_price: float
    buyer_name: Optional[str]
    sold_by_user_id: int
    notes: Optional[str]

    class Config:
        from_attributes = True
