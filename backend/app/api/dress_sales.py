from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db.session import get_db
from app.core.authz import get_current_user
from app.models.user import User
from app.models.dress import Dress, DressStatus
from app.models.dress_sale import DressSale
from app.schemas.dress_sale import DressSaleCreate, DressSaleOut

router = APIRouter(prefix="/api/dress-sales", tags=["Dress Sales"])

@router.post("", response_model=DressSaleOut)
def create_sale(payload: DressSaleCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in ("ADMIN", "OPERATOR"):
        raise HTTPException(status_code=403, detail="Forbidden")

    dress = db.get(Dress, payload.dress_id)
    if not dress:
        raise HTTPException(status_code=404, detail="Dress not found")

    if dress.status != DressStatus.AVAILABLE:
        raise HTTPException(status_code=409, detail=f"Dress not sellable (status={dress.status})")

    sale = DressSale(
        dress_id=payload.dress_id,
        sold_at=datetime.now(timezone.utc),
        sold_price=payload.sold_price,
        buyer_name=payload.buyer_name,
        sold_by_user_id=current_user.id,
        notes=payload.notes,
    )

    dress.status = DressStatus.SOLD
    db.add(sale)
    db.commit()
    db.refresh(sale)
    return sale

@router.get("", response_model=list[DressSaleOut])
def list_sales(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    stmt = select(DressSale).order_by(DressSale.id.desc())
    return list(db.scalars(stmt).all())
