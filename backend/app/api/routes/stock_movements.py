from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import Optional
from fastapi import APIRouter, Depends, Query

from app.db.session import get_db, Base, engine
from app.core.authz import require_operator_or_admin, get_current_user
from app.models.roll import Roll
from app.models.fabric import Fabric
from app.models.stock_movement import StockMovement
from app.schemas.stock_movement import StockMovementCreate, StockMovementOut

router = APIRouter(prefix="/stock-movements", tags=["stock-movements"])

Base.metadata.create_all(bind=engine)


def to_out(m: StockMovement) -> StockMovementOut:
    return StockMovementOut(
        id=m.id,
        roll_id=m.roll_id,
        movement_type=m.movement_type,
        meters=m.meters,
        reason=m.reason,
        reference=m.reference,
        created_at=m.created_at.isoformat(),
        roll_meters_available=m.roll.meters_available,
        fabric_code=m.roll.fabric.code,
    )

@router.get("", response_model=list[StockMovementOut])
def list_stock_movements(
    roll_id: Optional[int] = Query(default=None, ge=1),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    q = (
        db.query(StockMovement, Roll, Fabric)
        .join(Roll, StockMovement.roll_id == Roll.id)
        .join(Fabric, Roll.fabric_id == Fabric.id)
    )

    if roll_id is not None:
        q = q.filter(StockMovement.roll_id == roll_id)

    rows = q.order_by(StockMovement.id.desc()).all()

    # Armamos EXACTAMENTE lo que el frontend espera
    out: list[StockMovementOut] = []
    for sm, r, f in rows:
        out.append(
            StockMovementOut(
                id=sm.id,
                roll_id=sm.roll_id,
                movement_type=sm.movement_type,
                meters=sm.meters,
                reason=sm.reason,
                reference=sm.reference,
                created_at=sm.created_at,

                fabric_code=f.code,
                roll_meters_available=r.meters_available,
            )
        )

    return out

@router.post("", response_model=StockMovementOut)
def create_movement(
    payload: StockMovementCreate,
    db: Session = Depends(get_db),
    user=Depends(require_operator_or_admin),
):
    roll = db.execute(select(Roll).where(Roll.id == payload.roll_id)).scalar_one_or_none()
    if not roll:
        raise HTTPException(
            status_code=404,
            detail={"code": "ROLL_NOT_FOUND", "messageKey": "errors.rollNotFound", "params": {"rollId": payload.roll_id}},
        )

    # OPERATOR cannot ADJUST
    if user.role == "OPERATOR" and payload.movement_type == "ADJUST":
        raise HTTPException(
            status_code=403,
            detail={"code": "ADJUST_FORBIDDEN", "messageKey": "errors.adjustForbidden", "params": {}},
        )

    # validate reason for ADJUST
    if payload.movement_type == "ADJUST" and (payload.reason is None or payload.reason.strip() == ""):
        raise HTTPException(
            status_code=400,
            detail={"code": "ADJUST_REASON_REQUIRED", "messageKey": "errors.adjustReasonRequired", "params": {}},
        )

    # apply stock rules
    if payload.movement_type == "IN":
        new_available = roll.meters_available + payload.meters

    elif payload.movement_type == "OUT":
        new_available = roll.meters_available - payload.meters
        if new_available < 0:
            raise HTTPException(
                status_code=400,
                detail={"code": "STOCK_NEGATIVE_NOT_ALLOWED", "messageKey": "errors.stockNegativeNotAllowed", "params": {"rollId": roll.id}},
            )

    else:  # ADJUST sets exact value
        new_available = payload.meters
        if new_available < 0:
            raise HTTPException(
                status_code=400,
                detail={"code": "STOCK_NEGATIVE_NOT_ALLOWED", "messageKey": "errors.stockNegativeNotAllowed", "params": {"rollId": roll.id}},
            )

    movement = StockMovement(
        roll_id=payload.roll_id,
        movement_type=payload.movement_type,
        meters=payload.meters,
        reason=payload.reason,
        reference=payload.reference,
    )

    roll.meters_available = new_available
    db.add(movement)
    db.commit()
    db.refresh(movement)

    # ensure joined roll is up to date
    movement.roll = roll
    return to_out(movement)

