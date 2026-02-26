from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db.session import get_db
from app.models.user import User
from app.models.dress import Dress, DressStatus
from app.schema.dress import DressCreate, DressOut

from app.core.authz import get_current_user# <-- AJUSTAR según tu proyecto

router = APIRouter(prefix="/api/dresses", tags=["Dresses"])


@router.post("", response_model=DressOut)
def create_dress(
    payload: DressCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ("ADMIN", "OPERATOR"):
        raise HTTPException(status_code=403, detail="Forbidden")

    exists = db.scalar(select(Dress).where(Dress.code == payload.code))
    if exists:
        raise HTTPException(status_code=409, detail="Dress code already exists")

    dress = Dress(**payload.model_dump())
    db.add(dress)
    db.commit()
    db.refresh(dress)
    return dress


@router.get("", response_model=list[DressOut])
def list_dresses(
    status: DressStatus | None = Query(default=None),
    q: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(Dress)
    if status:
        stmt = stmt.where(Dress.status == status)
    if q:
        like = f"%{q}%"
        stmt = stmt.where((Dress.code.ilike(like)) | (Dress.name.ilike(like)))
    return list(db.scalars(stmt.order_by(Dress.id.desc())).all())
