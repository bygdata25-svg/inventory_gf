from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db.session import get_db
from app.models.user import User
from app.models.capsule import Capsule
from app.schemas.capsule import CapsuleCreate, CapsuleOut
from app.core.authz import get_current_user

router = APIRouter(prefix="/api/capsules", tags=["Capsules"])


@router.post("", response_model=CapsuleOut)
def create_capsule(
    payload: CapsuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ("ADMIN", "OPERATOR"):
        raise HTTPException(status_code=403, detail="Forbidden")

    exists = db.scalar(select(Capsule).where(Capsule.name == payload.name))
    if exists:
        raise HTTPException(status_code=409, detail="Capsule already exists")

    cap = Capsule(name=payload.name)
    db.add(cap)
    db.commit()
    db.refresh(cap)
    return cap


@router.get("", response_model=list[CapsuleOut])
def list_capsules(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return list(db.scalars(select(Capsule).order_by(Capsule.name.asc())).all())
