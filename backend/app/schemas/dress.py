from datetime import datetime
from math import ceil
from pydantic import BaseModel, Field
from typing import Optional

from app.models.dress import DressStatus


class DressCreate(BaseModel):
    code: str = Field(min_length=1, max_length=50)
    name: str = Field(min_length=1, max_length=120)
    size: Optional[str] = None
    color: Optional[str] = None
    notes: Optional[str] = None
    photo_url: Optional[str] = None
    price: Optional[float] = None
    capsule_id: Optional[int] = None
    location: Optional[str] = None


class DressOut(BaseModel):
    id: int
    code: str
    name: str
    size: Optional[str]
    color: Optional[str]
    status: DressStatus
    notes: Optional[str]
    created_at: datetime
    photo_url: Optional[str]
    price: Optional[float]
    capsule_id: Optional[int]
    capsule_name: Optional[str] = None
    location: Optional[str]

    class Config:
        from_attributes = True


class DressListOut(BaseModel):
    items: list[DressOut]
    total: int
    page: int
    page_size: int
    pages: int

class DressUpdate(BaseModel):
    price: Optional[float] = None
    capsule_id: Optional[int] = None
    location: Optional[str] = None
    notes: Optional[str] = None
