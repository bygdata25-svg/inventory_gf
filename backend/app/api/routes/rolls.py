from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db.session import get_db, Base, engine
from app.core.authz import require_operator_or_admin, require_admin

from app.models.roll import Roll
from app.models.fabric import Fabric
from app.models.supplier import Supplier
from app.schemas.roll import RollCreate, RollUpdate, RollOut

router = APIRouter(prefix="/api/rolls", tags=["rolls"])

Base.metadata.create_all(bind=engine)


def to_out(r: Roll) -> RollOut:
    return RollOut(
        id=r.id,
        fabric_id=r.fabric_id,
        supplier_id=r.supplier_id,
        lot_number=r.lot_number,
        location=r.location,
        meters_initial=r.meters_initial,
        meters_available=r.meters_available,
        is_active=r.is_active,

        # Fabric (joined)
        fabric_code=r.fabric.code if r.fabric else "",
        fabric_name=(r.fabric.name if r.fabric else None),
        fabric_color=(r.fabric.color if r.fabric else None),
        fabric_type=(r.fabric.fabric_type if r.fabric else None),
        fabric_width_m=(float(r.fabric.width_m) if (r.fabric and r.fabric.width_m is not None) else None),

        # Supplier (joined)
        supplier_name=(r.supplier.name if r.supplier else None),
    )


@router.get("", response_model=list[RollOut])
def list_rolls(
    db: Session = Depends(get_db),
    _user=Depends(require_operator_or_admin),
):
    rolls = db.execute(select(Roll).order_by(Roll.id.desc())).scalars().all()
    return [to_out(r) for r in rolls]


@router.post("", response_model=RollOut)
def create_roll(
    payload: RollCreate,
    db: Session = Depends(get_db),
    _user=Depends(require_operator_or_admin),
):
    fabric = db.execute(select(Fabric).where(Fabric.id == payload.fabric_id)).scalar_one_or_none()
    if not fabric:
        raise HTTPException(
            status_code=404,
            detail={
                "code": "FABRIC_NOT_FOUND",
                "messageKey": "errors.fabricNotFound",
                "params": {"fabricId": payload.fabric_id},
            },
        )

    supplier = db.execute(select(Supplier).where(Supplier.id == payload.supplier_id)).scalar_one_or_none()
    if not supplier:
        raise HTTPException(
            status_code=404,
            detail={
                "code": "SUPPLIER_NOT_FOUND",
                "messageKey": "errors.supplierNotFound",
                "params": {"supplierId": payload.supplier_id},
            },
        )

    meters_available = payload.meters_available
    if meters_available is None:
        meters_available = payload.meters_initial

    if meters_available > payload.meters_initial:
        raise HTTPException(
            status_code=400,
            detail={
                "code": "METERS_AVAILABLE_GT_INITIAL",
                "messageKey": "errors.metersAvailableGreaterThanInitial",
                "params": {},
            },
        )

    roll = Roll(
        fabric_id=payload.fabric_id,
        supplier_id=payload.supplier_id,
        lot_number=payload.lot_number,
        location=payload.location,
        meters_initial=payload.meters_initial,
        meters_available=meters_available,
        is_active=True,
    )
    db.add(roll)
    db.commit()
    db.refresh(roll)
    return to_out(roll)


@router.get("/{roll_id}", response_model=RollOut)
def get_roll(
    roll_id: int,
    db: Session = Depends(get_db),
    _user=Depends(require_operator_or_admin),
):
    roll = db.execute(select(Roll).where(Roll.id == roll_id)).scalar_one_or_none()
    if not roll:
        raise HTTPException(
            status_code=404,
            detail={"code": "ROLL_NOT_FOUND", "messageKey": "errors.rollNotFound", "params": {"rollId": roll_id}},
        )
    return to_out(roll)


@router.patch("/{roll_id}", response_model=RollOut)
def update_roll(
    roll_id: int,
    payload: RollUpdate,
    db: Session = Depends(get_db),
    _user=Depends(require_operator_or_admin),
):
    roll = db.execute(select(Roll).where(Roll.id == roll_id)).scalar_one_or_none()
    if not roll:
        raise HTTPException(
            status_code=404,
            detail={"code": "ROLL_NOT_FOUND", "messageKey": "errors.rollNotFound", "params": {"rollId": roll_id}},
        )

    data = payload.model_dump(exclude_unset=True)

    if "supplier_id" in data and data["supplier_id"] is not None:
        supplier = db.execute(select(Supplier).where(Supplier.id == data["supplier_id"])).scalar_one_or_none()
        if not supplier:
            raise HTTPException(
                status_code=404,
                detail={
                    "code": "SUPPLIER_NOT_FOUND",
                    "messageKey": "errors.supplierNotFound",
                    "params": {"supplierId": data["supplier_id"]},
                },
            )
        roll.supplier_id = data["supplier_id"]

    if "meters_available" in data and data["meters_available"] is not None:
        if data["meters_available"] > roll.meters_initial:
            raise HTTPException(
                status_code=400,
                detail={
                    "code": "METERS_AVAILABLE_GT_INITIAL",
                    "messageKey": "errors.metersAvailableGreaterThanInitial",
                    "params": {},
                },
            )
        roll.meters_available = data["meters_available"]

    if "lot_number" in data:
        roll.lot_number = data["lot_number"]
    if "location" in data:
        roll.location = data["location"]
    if "is_active" in data and data["is_active"] is not None:
        roll.is_active = data["is_active"]

    db.commit()
    db.refresh(roll)
    return to_out(roll)


@router.delete("/{roll_id}")
def delete_roll(
    roll_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    roll = db.execute(select(Roll).where(Roll.id == roll_id)).scalar_one_or_none()
    if not roll:
        raise HTTPException(
            status_code=404,
            detail={"code": "ROLL_NOT_FOUND", "messageKey": "errors.rollNotFound", "params": {"rollId": roll_id}},
        )

    db.delete(roll)
    db.commit()
    return {"status": "deleted", "roll_id": roll_id}

