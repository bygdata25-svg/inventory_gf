from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, select

from app.db.session import get_db
from app.core.authz import get_current_user
from app.models.dress import Dress, DressStatus
from app.models.dress_sale import DressSale
from app.models.dress_loan import DressLoan

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/summary")
def dashboard_summary(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    now = datetime.utcnow()
    start_month = datetime(now.year, now.month, 1)

    total_available = db.scalar(
        select(func.count()).where(Dress.status == DressStatus.AVAILABLE)
    )

    total_loaned = db.scalar(
        select(func.count()).where(Dress.status == DressStatus.LOANED)
    )

    total_sold = db.scalar(
        select(func.count()).where(Dress.status == DressStatus.SOLD)
    )

    total_sales_month = db.scalar(
        select(func.count())
        .select_from(DressSale)
        .where(DressSale.sold_at >= start_month)
    )

    total_revenue_month = db.scalar(
        select(func.coalesce(func.sum(DressSale.sold_price), 0))
        .where(DressSale.sold_at >= start_month)
    )

    avg_sale_month = 0
    if total_sales_month and total_sales_month > 0:
        avg_sale_month = float(total_revenue_month) / total_sales_month

    return {
        "available": total_available or 0,
        "loaned": total_loaned or 0,
        "sold": total_sold or 0,
        "sales_month": total_sales_month or 0,
        "revenue_month": float(total_revenue_month or 0),
        "avg_sale_month": float(avg_sale_month)
    }

from app.models.dress_loan import DressLoan
from app.models.dress_sale import DressSale


@router.get("/activity")
def dashboard_activity(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    events = []

    # préstamos creados
    loans = db.execute(
        select(DressLoan)
        .order_by(DressLoan.delivered_at.desc())
        .limit(limit)
    ).scalars().all()

    for loan in loans:
        events.append({
            "type": "loan_created",
            "title": "Préstamo creado",
            "subtitle": f"{loan.customer_name} · Vestido #{loan.dress_id}",
            "when": loan.delivered_at
        })

    # devoluciones
    returns = db.execute(
        select(DressLoan)
        .where(DressLoan.returned_at.is_not(None))
        .order_by(DressLoan.returned_at.desc())
        .limit(limit)
    ).scalars().all()

    for loan in returns:
        events.append({
            "type": "loan_returned",
            "title": "Devolución registrada",
            "subtitle": f"Vestido #{loan.dress_id}",
            "when": loan.returned_at
        })

    # ventas
    sales = db.execute(
        select(DressSale)
        .order_by(DressSale.sold_at.desc())
        .limit(limit)
    ).scalars().all()

    for sale in sales:
        events.append({
            "type": "sale",
            "title": "Venta registrada",
            "subtitle": f"Vestido #{sale.dress_id} · U$S {sale.sold_price}",
            "when": sale.sold_at
        })

    # ordenar cronológicamente
    events.sort(key=lambda x: x["when"], reverse=True)

    return events[:limit]
