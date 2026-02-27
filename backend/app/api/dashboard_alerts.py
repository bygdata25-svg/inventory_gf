from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from app.db.session import get_db
from app.core.authz import get_current_user
from app.models.dress_loan import DressLoan, LoanStatus

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/alerts")
def dashboard_alerts(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    soon_limit = now + timedelta(days=2)

    overdue_count = db.scalar(
        select(func.count())
        .select_from(DressLoan)
        .where(
            DressLoan.status == LoanStatus.OPEN,
            DressLoan.returned_at.is_(None),
            DressLoan.due_at < now,
        )
    ) or 0

    due_soon_count = db.scalar(
        select(func.count())
        .select_from(DressLoan)
        .where(
            DressLoan.status == LoanStatus.OPEN,
            DressLoan.returned_at.is_(None),
            DressLoan.due_at >= now,
            DressLoan.due_at <= soon_limit,
        )
    ) or 0

    # Top 5 vencidos (más viejos primero)
    overdue_top = db.execute(
        select(
            DressLoan.id,
            DressLoan.dress_id,
            DressLoan.customer_name,
            DressLoan.due_at,
        )
        .where(
            DressLoan.status == LoanStatus.OPEN,
            DressLoan.returned_at.is_(None),
            DressLoan.due_at < now,
        )
        .order_by(DressLoan.due_at.asc())
        .limit(5)
    ).all()

    # Top 5 próximos a vencer
    due_soon_top = db.execute(
        select(
            DressLoan.id,
            DressLoan.dress_id,
            DressLoan.customer_name,
            DressLoan.due_at,
        )
        .where(
            DressLoan.status == LoanStatus.OPEN,
            DressLoan.returned_at.is_(None),
            DressLoan.due_at >= now,
            DressLoan.due_at <= soon_limit,
        )
        .order_by(DressLoan.due_at.asc())
        .limit(5)
    ).all()

    return {
        "overdue_count": int(overdue_count),
        "due_soon_count": int(due_soon_count),
        "overdue_top": [
            {"id": r.id, "dress_id": r.dress_id, "customer_name": r.customer_name, "due_at": r.due_at}
            for r in overdue_top
        ],
        "due_soon_top": [
            {"id": r.id, "dress_id": r.dress_id, "customer_name": r.customer_name, "due_at": r.due_at}
            for r in due_soon_top
        ],
    }
