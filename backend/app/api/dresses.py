from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db.session import get_db
from app.models.user import User
from app.models.dress import Dress, DressStatus
from app.models.capsule import Capsule
from app.schemas.dress import DressCreate, DressOut
from app.core.authz import get_current_user

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

    result = DressOut.model_validate(dress)
    result.capsule_name = dress.capsule.name if dress.capsule else None
    return result


@router.get("", response_model=list[DressOut])
def list_dresses(
    status: DressStatus | None = Query(default=None),
    capsule_id: int | None = Query(default=None),
    q: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(Dress, Capsule.name).outerjoin(Capsule, Dress.capsule_id == Capsule.id)

    if status:
        stmt = stmt.where(Dress.status == status)
    if capsule_id:
        stmt = stmt.where(Dress.capsule_id == capsule_id)
    if q:
        like = f"%{q}%"
        stmt = stmt.where((Dress.code.ilike(like)) | (Dress.name.ilike(like)))

    rows = db.execute(stmt.order_by(Dress.id.desc())).all()

    out = []
    for dress, capsule_name in rows:
        item = DressOut.model_validate(dress)
        item.capsule_name = capsule_name
        out.append(item)

    return out


@router.get("/{dress_id}", response_model=DressOut)
def get_dress(
    dress_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    row = db.execute(
        select(Dress, Capsule.name)
        .outerjoin(Capsule, Dress.capsule_id == Capsule.id)
        .where(Dress.id == dress_id)
    ).first()

    if not row:
        raise HTTPException(status_code=404, detail="Dress not found")

    dress, capsule_name = row

    result = DressOut.model_validate(dress)
    result.capsule_name = capsule_name
    return result
