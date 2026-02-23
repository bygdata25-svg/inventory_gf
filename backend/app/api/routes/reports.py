from fastapi import APIRouter, Depends
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from app.db.session import get_db
from app.core.authz import require_operator_or_admin

from app.models.roll import Roll
from app.models.fabric import Fabric
from app.models.supplier import Supplier
from app.models.stock_movement import StockMovement

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/stock")
def report_stock(
    only_available: bool = True,
    db: Session = Depends(get_db),
    _user=Depends(require_operator_or_admin),
):
    """
    Stock actual por rollo.
    - only_available=True: solo rollos con metros_available > 0 y activos.
    """

    q = (
        select(Roll, Fabric, Supplier)
        .join(Fabric, Fabric.id == Roll.fabric_id)
        .join(Supplier, Supplier.id == Roll.supplier_id, isouter=True)
    )

    if only_available:
        q = q.where(Roll.is_active == True).where(Roll.meters_available > 0)

    q = q.order_by(Roll.id.desc())

    rows = db.execute(q).all()

    out = []
    for roll, fabric, supplier in rows:
        out.append(
            {
                "roll_id": roll.id,
                "lot_number": roll.lot_number,
                "location": roll.location,
                "meters_initial": roll.meters_initial,
                "meters_available": roll.meters_available,
                "roll_is_active": roll.is_active,

                "fabric_id": fabric.id,
                "fabric_code": fabric.code,
                "fabric_name": fabric.name,
                "fabric_color": fabric.color,
                "fabric_type": fabric.fabric_type,
                "fabric_width_m": float(fabric.width_m) if fabric.width_m is not None else None,
                "price_per_meter": float(fabric.price_per_meter) if fabric.price_per_meter is not None else None,

                "supplier_id": roll.supplier_id,
                "supplier_name": (supplier.name if supplier else None),
            }
        )

    return out


@router.get("/movements")
def report_movements(
    roll_id: int | None = None,
    movement_type: str | None = None,  # IN | OUT | ADJUST
    q: str | None = None,
    date_from: str | None = None,  # ISO: "2026-02-01"
    date_to: str | None = None,    # ISO: "2026-02-12"
    limit: int = 500,
    db: Session = Depends(get_db),
    _user=Depends(require_operator_or_admin),
):
    """
    Reporte de movimientos (filtrable).
    - roll_id: filtra por rollo
    - movement_type: IN/OUT/ADJUST
    - q: busca texto en reason/reference/fabric_code/fabric_name/color/lot/location/proveedor
    - date_from/date_to: rango por created_at (YYYY-MM-DD o ISO datetime)
    """

    q_stmt = (
        select(StockMovement, Roll, Fabric, Supplier)
        .join(Roll, Roll.id == StockMovement.roll_id)
        .join(Fabric, Fabric.id == Roll.fabric_id)
        .join(Supplier, Supplier.id == Roll.supplier_id, isouter=True)
        .order_by(StockMovement.id.desc())
        .limit(limit)
    )

    if roll_id:
        q_stmt = q_stmt.where(StockMovement.roll_id == roll_id)

    if movement_type:
        q_stmt = q_stmt.where(StockMovement.movement_type == movement_type)

    # fechas (parse flexible)
    def _parse_dt(s: str) -> datetime | None:
        if not s:
            return None
        s = s.strip()
        try:
          # si viene "YYYY-MM-DD"
          if len(s) == 10:
              return datetime.fromisoformat(s + "T00:00:00")
          return datetime.fromisoformat(s)
        except Exception:
          return None

    dt_from = _parse_dt(date_from) if date_from else None
    dt_to = _parse_dt(date_to) if date_to else None

    if dt_from:
        q_stmt = q_stmt.where(StockMovement.created_at >= dt_from)
    if dt_to:
        q_stmt = q_stmt.where(StockMovement.created_at <= dt_to)

    if q and q.strip():
        term = f"%{q.strip().lower()}%"
        # búsqueda simple “contains” (si querés lo hacemos con ilike)
        from sqlalchemy import or_, func
        q_stmt = q_stmt.where(
            or_(
                func.lower(StockMovement.reason).like(term),
                func.lower(StockMovement.reference).like(term),
                func.lower(Fabric.code).like(term),
                func.lower(Fabric.name).like(term),
                func.lower(Fabric.color).like(term),
                func.lower(Roll.lot_number).like(term),
                func.lower(Roll.location).like(term),
                func.lower(Supplier.name).like(term),
            )
        )

    rows = db.execute(q_stmt).all()

    out = []
    for m, roll, fabric, supplier in rows:
        out.append(
            {
                "id": m.id,
                "roll_id": m.roll_id,
                "movement_type": m.movement_type,
                "meters": m.meters,
                "reason": m.reason,
                "reference": m.reference,
                "created_at": m.created_at.isoformat() if m.created_at else None,

                "roll_meters_available": roll.meters_available,
                "lot_number": roll.lot_number,
                "location": roll.location,

                "fabric_id": fabric.id,
                "fabric_code": fabric.code,
                "fabric_name": fabric.name,
                "fabric_color": fabric.color,

                "supplier_id": roll.supplier_id,
                "supplier_name": (supplier.name if supplier else None),
            }
        )

    return out

@router.get("/valuation-by-fabric")
def report_valuation_by_fabric(
    only_available: bool = True,
    include_inactive: bool = False,
    db: Session = Depends(get_db),
    _user=Depends(require_operator_or_admin),
):
    """
    Valuación estimada agrupada por tela.
    - only_available=True: solo rollos activos con metros_available > 0
    - include_inactive=False: si False, excluye telas inactivas
    """

    q = (
        select(
            Fabric.id.label("fabric_id"),
            Fabric.code.label("fabric_code"),
            Fabric.name.label("fabric_name"),
            Fabric.color.label("fabric_color"),
            Fabric.fabric_type.label("fabric_type"),
            Fabric.width_m.label("fabric_width_m"),
            Fabric.price_per_meter.label("price_per_meter"),
            func.sum(Roll.meters_available).label("meters_available_sum"),
            func.sum(Roll.meters_available * Fabric.price_per_meter).label("value_sum"),
            Supplier.id.label("supplier_id"),
            Supplier.name.label("supplier_name"),
        )
        .join(Roll, Roll.fabric_id == Fabric.id)
        # supplier ahora depende del rollo
        .join(Supplier, Supplier.id == Roll.supplier_id, isouter=True)
        .group_by(
            Fabric.id, Fabric.code, Fabric.name, Fabric.color, Fabric.fabric_type,
            Fabric.width_m, Fabric.price_per_meter, Supplier.id, Supplier.name
        )
        .order_by(Fabric.code.asc())
    )

    if only_available:
        q = q.where(Roll.is_active == True).where(Roll.meters_available > 0)

    if not include_inactive:
        q = q.where(Fabric.is_active == True)

    rows = db.execute(q).all()

    out = []
    for r in rows:
        out.append(
            {
                "fabric_id": r.fabric_id,
                "fabric_code": r.fabric_code,
                "fabric_name": r.fabric_name,
                "fabric_color": r.fabric_color,
                "fabric_type": r.fabric_type,
                "fabric_width_m": float(r.fabric_width_m) if r.fabric_width_m is not None else None,
                "price_per_meter": float(r.price_per_meter) if r.price_per_meter is not None else None,
                "meters_available_sum": float(r.meters_available_sum) if r.meters_available_sum is not None else 0.0,
                "value_sum": float(r.value_sum) if r.value_sum is not None else 0.0,
                "supplier_id": r.supplier_id,
                "supplier_name": r.supplier_name,
            }
        )

    return out

