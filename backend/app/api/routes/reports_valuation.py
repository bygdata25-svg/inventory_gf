# backend/app/api/routes/reports_valuation.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select, func, case

from app.db.session import get_db
from app.core.authz import require_operator_or_admin

from app.models.roll import Roll
from app.models.fabric import Fabric
from app.models.supplier import Supplier

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/valuation")
def report_valuation(
    only_available: bool = True,
    db: Session = Depends(get_db),
    _user=Depends(require_operator_or_admin),
):
    """
    Valuación de stock (estimada) usando:
      value = meters_available * fabric.price_per_meter
    - only_available=True: solo rollos activos con metros_available > 0
    """

    q = (
        select(
            Roll.id.label("roll_id"),
            Roll.lot_number.label("lot_number"),
            Roll.location.label("location"),
            Roll.meters_available.label("meters_available"),
            Roll.is_active.label("roll_is_active"),

            Fabric.id.label("fabric_id"),
            Fabric.code.label("fabric_code"),
            Fabric.name.label("fabric_name"),
            Fabric.color.label("fabric_color"),
            Fabric.fabric_type.label("fabric_type"),
            Fabric.width_m.label("fabric_width_m"),
            Fabric.price_per_meter.label("price_per_meter"),

            Roll.supplier_id.label("supplier_id"),
            Supplier.name.label("supplier_name"),

            # value = meters_available * price_per_meter (si price_per_meter es NULL => NULL)
            case(
                (Fabric.price_per_meter.is_(None), None),
                else_=(Roll.meters_available * Fabric.price_per_meter),
            ).label("value_estimated"),
        )
        .join(Fabric, Fabric.id == Roll.fabric_id)
        .join(Supplier, Supplier.id == Roll.supplier_id, isouter=True)
    )

    if only_available:
        q = q.where(Roll.is_active == True).where(Roll.meters_available > 0)

    q = q.order_by(Roll.id.desc())

    rows = db.execute(q).all()

    out_rows = []
    total_meters = 0
    total_value = 0.0

    for r in rows:
        meters = int(r.meters_available or 0)
        total_meters += meters

        val = None
        if r.value_estimated is not None:
            # value_estimated puede venir como Decimal
            val = float(r.value_estimated)
            total_value += val

        out_rows.append(
            {
                "roll_id": r.roll_id,
                "lot_number": r.lot_number,
                "location": r.location,
                "meters_available": meters,
                "roll_is_active": bool(r.roll_is_active),

                "fabric_id": r.fabric_id,
                "fabric_code": r.fabric_code,
                "fabric_name": r.fabric_name,
                "fabric_color": r.fabric_color,
                "fabric_type": r.fabric_type,
                "fabric_width_m": float(r.fabric_width_m) if r.fabric_width_m is not None else None,
                "price_per_meter": float(r.price_per_meter) if r.price_per_meter is not None else None,

                "supplier_id": r.supplier_id,
                "supplier_name": r.supplier_name,

                "value_estimated": val,
            }
        )

    return {
        "totals": {
            "meters_available": total_meters,
            "value_estimated": round(total_value, 2),
        },
        "rows": out_rows,
    }

