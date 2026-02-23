# backend/app/api/routes/fabrics.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, cast
from sqlalchemy.types import Integer
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.db.session import get_db
from app.core.authz import get_current_user
from app.models.fabric import Fabric
from app.schemas.fabric import FabricCreate, FabricUpdate, FabricOut

router = APIRouter(prefix="/fabrics", tags=["fabrics"])

CODE_PAD = 4  # 0001, 0002, ...

# ---------- helpers ----------

def next_fabric_code(db: Session) -> str:
    last_number = db.execute(
        select(cast(Fabric.code, Integer))
        .order_by(cast(Fabric.code, Integer).desc())
        .limit(1)
    ).scalar_one_or_none()

    next_number = (last_number or 0) + 1
    return str(next_number).zfill(CODE_PAD)

def to_out(fabric: Fabric) -> FabricOut:
    return FabricOut(
        id=fabric.id,
        code=fabric.code,
        name=fabric.name,
        color=fabric.color,
        width_m=float(fabric.width_m) if fabric.width_m is not None else None,
        length_m=float(fabric.length_m) if fabric.length_m is not None else None,
        fabric_type=fabric.fabric_type,
        weave=fabric.weave,
        finish=fabric.finish,
        price_per_meter=float(fabric.price_per_meter) if fabric.price_per_meter is not None else None,
        is_active=fabric.is_active,
    )

# ---------- endpoints ----------

@router.get("", response_model=list[FabricOut])
def list_fabrics(
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    fabrics = db.execute(select(Fabric).order_by(Fabric.code.asc())).scalars().all()
    return [to_out(f) for f in fabrics]


@router.post("", response_model=FabricOut)
def create_fabric(
    data: FabricCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    attempts = 0

    while True:
        attempts += 1
        if attempts > 5:
            raise HTTPException(status_code=500, detail="Could not generate fabric code")

        code = next_fabric_code(db)

        fabric = Fabric(
            code=code,
            name=data.name.strip() if data.name else None,
            color=data.color.strip(),
            width_m=data.width_m,
            length_m=data.length_m,
            fabric_type=(data.fabric_type.strip() if data.fabric_type else None),
            weave=(data.weave.strip() if data.weave else None),
            finish=(data.finish.strip() if data.finish else None),
            price_per_meter=data.price_per_meter,
            is_active=True,
        )

        try:
            db.add(fabric)
            db.commit()
            db.refresh(fabric)
            break
        except IntegrityError:
            db.rollback()
            continue

    return to_out(fabric)


@router.put("/{fabric_id}", response_model=FabricOut)
def update_fabric(
    fabric_id: int,
    data: FabricUpdate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    fabric = db.execute(select(Fabric).where(Fabric.id == fabric_id)).scalar_one_or_none()
    if not fabric:
        raise HTTPException(status_code=404, detail="Fabric not found")

    for field, value in data.dict(exclude_unset=True).items():
        setattr(fabric, field, value.strip() if isinstance(value, str) else value)

    db.commit()
    db.refresh(fabric)

    return to_out(fabric)


@router.delete("/{fabric_id}")
def delete_fabric(
    fabric_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    fabric = db.execute(select(Fabric).where(Fabric.id == fabric_id)).scalar_one_or_none()
    if not fabric:
        raise HTTPException(status_code=404, detail="Fabric not found")

    db.delete(fabric)
    db.commit()

    return {"ok": True}

