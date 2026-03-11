from math import ceil
from pathlib import Path
from uuid import uuid4
import shutil

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from pydantic import BaseModel

from app.db.session import get_db
from app.models.user import User
from app.models.dress import Dress, DressStatus
from app.models.capsule import Capsule
from app.schemas.dress import DressOut, DressListOut
from app.core.authz import get_current_user

router = APIRouter(prefix="/api/dresses", tags=["Dresses"])

UPLOAD_DIR = Path("uploads/dresses")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def save_uploaded_photo(photo: UploadFile | None) -> str | None:
    if not photo or not photo.filename:
        return None

    ext = Path(photo.filename).suffix.lower()
    if ext not in {".jpg", ".jpeg", ".png", ".webp"}:
        raise HTTPException(status_code=400, detail="Invalid image format")

    filename = f"{uuid4().hex}{ext}"
    file_path = UPLOAD_DIR / filename

    with file_path.open("wb") as buffer:
        shutil.copyfileobj(photo.file, buffer)

    return f"/uploads/dresses/{filename}"


@router.post("", response_model=DressOut)
def create_dress(
    code: str = Form(...),
    name: str = Form(...),
    color: str | None = Form(default=None),
    size: str | None = Form(default=None),
    price: float | None = Form(default=None),
    location: str | None = Form(default=None),
    notes: str | None = Form(default=None),
    status: DressStatus = Form(...),
    capsule_id: int | None = Form(default=None),
    photo: UploadFile | None = File(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ("ADMIN", "OPERATOR"):
        raise HTTPException(status_code=403, detail="Forbidden")

    exists = db.scalar(select(Dress).where(Dress.code == code))
    if exists:
        raise HTTPException(status_code=409, detail="Dress code already exists")

    if capsule_id is not None:
        capsule = db.get(Capsule, capsule_id)
        if not capsule:
            raise HTTPException(status_code=404, detail="Capsule not found")

    photo_url = save_uploaded_photo(photo)

    dress = Dress(
        code=code,
        name=name,
        description=description,
        color=color,
        size=size,
        price=price,
        location=location,
        notes=notes,
        status=status,
        capsule_id=capsule_id,
        photo_url=photo_url,
    )

    db.add(dress)
    db.commit()
    db.refresh(dress)

    result = DressOut.model_validate(dress)
    result.capsule_name = dress.capsule.name if dress.capsule else None
    return result


@router.get("", response_model=DressListOut)
def list_dresses(
    status: DressStatus | None = Query(default=None),
    capsule_id: int | None = Query(default=None),
    q: str | None = Query(default=None),
    color: str | None = Query(default=None),
    location: str | None = Query(default=None),
    price_min: float | None = Query(default=None),
    price_max: float | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=15, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    base_stmt = select(Dress, Capsule.name).outerjoin(Capsule, Dress.capsule_id == Capsule.id)

    if status:
        base_stmt = base_stmt.where(Dress.status == status)

    if capsule_id:
        base_stmt = base_stmt.where(Dress.capsule_id == capsule_id)

    if q:
        like = f"%{q}%"
        base_stmt = base_stmt.where(
            (Dress.code.ilike(like)) |
            (Dress.name.ilike(like))
        )

    if color:
        base_stmt = base_stmt.where(Dress.color.ilike(f"%{color}%"))

    if location:
        base_stmt = base_stmt.where(Dress.location.ilike(f"%{location}%"))

    if price_min is not None:
        base_stmt = base_stmt.where(Dress.price >= price_min)

    if price_max is not None:
        base_stmt = base_stmt.where(Dress.price <= price_max)

    count_stmt = select(func.count()).select_from(Dress)

    if status:
        count_stmt = count_stmt.where(Dress.status == status)

    if capsule_id:
        count_stmt = count_stmt.where(Dress.capsule_id == capsule_id)

    if q:
        like = f"%{q}%"
        count_stmt = count_stmt.where(
            (Dress.code.ilike(like)) |
            (Dress.name.ilike(like))
        )

    if color:
        count_stmt = count_stmt.where(Dress.color.ilike(f"%{color}%"))

    if location:
        count_stmt = count_stmt.where(Dress.location.ilike(f"%{location}%"))

    if price_min is not None:
        count_stmt = count_stmt.where(Dress.price >= price_min)

    if price_max is not None:
        count_stmt = count_stmt.where(Dress.price <= price_max)

    total = db.scalar(count_stmt) or 0
    pages = ceil(total / page_size) if total > 0 else 1
    offset = (page - 1) * page_size

    rows = db.execute(
        base_stmt.order_by(Dress.id.desc()).offset(offset).limit(page_size)
    ).all()

    items = []
    for dress, capsule_name in rows:
        item = DressOut.model_validate(dress)
        item.capsule_name = capsule_name
        items.append(item)

    return DressListOut(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )


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


class DressStatusUpdate(BaseModel):
    status: DressStatus


@router.patch("/{dress_id}/status", response_model=DressOut)
def update_dress_status(
    dress_id: int,
    payload: DressStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ("ADMIN", "OPERATOR"):
        raise HTTPException(status_code=403, detail="Forbidden")

    dress = db.get(Dress, dress_id)

    if not dress:
        raise HTTPException(status_code=404, detail="Dress not found")

    dress.status = payload.status

    db.commit()
    db.refresh(dress)

    result = DressOut.model_validate(dress)
    result.capsule_name = dress.capsule.name if dress.capsule else None
    return result


@router.patch("/{dress_id}", response_model=DressOut)
def update_dress(
    dress_id: int,
    code: str | None = Form(default=None),
    name: str | None = Form(default=None),
    description: str | None = Form(default=None),
    color: str | None = Form(default=None),
    size: str | None = Form(default=None),
    price: float | None = Form(default=None),
    location: str | None = Form(default=None),
    notes: str | None = Form(default=None),
    status: DressStatus | None = Form(default=None),
    capsule_id: int | None = Form(default=None),
    photo: UploadFile | None = File(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Only admins can edit dresses")

    dress = db.get(Dress, dress_id)
    if not dress:
        raise HTTPException(status_code=404, detail="Dress not found")

    if capsule_id is not None:
        capsule = db.get(Capsule, capsule_id)
        if not capsule:
            raise HTTPException(status_code=404, detail="Capsule not found")
        dress.capsule_id = capsule_id

    if code is not None:
        exists = db.scalar(select(Dress).where(Dress.code == code, Dress.id != dress_id))
        if exists:
            raise HTTPException(status_code=409, detail="Dress code already exists")
        dress.code = code

    if name is not None:
        dress.name = name
    if description is not None:
        dress.description = description
    if color is not None:
        dress.color = color
    if size is not None:
        dress.size = size
    if price is not None:
        dress.price = price
    if location is not None:
        dress.location = location
    if notes is not None:
        dress.notes = notes
    if status is not None:
        dress.status = status

    new_photo_url = save_uploaded_photo(photo)
    if new_photo_url:
        dress.photo_url = new_photo_url

    db.commit()
    db.refresh(dress)

    result = DressOut.model_validate(dress)
    result.capsule_name = dress.capsule.name if dress.capsule else None
    return result
