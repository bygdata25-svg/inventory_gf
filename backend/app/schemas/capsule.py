from datetime import datetime
from pydantic import BaseModel, Field


class CapsuleCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)


class CapsuleOut(BaseModel):
    id: int
    name: str
    created_at: datetime

    class Config:
        from_attributes = True
