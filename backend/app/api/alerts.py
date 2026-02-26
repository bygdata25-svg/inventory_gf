from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db.session import get_db
from app.models.user import User
from app.models.dress_loan import DressLoan, LoanStatus
from app.schema.dress_loan import LoanOut
from app.core.authz import get_current_user# ajustar

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])

@router.get("/overdue-loans", response_model=list[LoanOut])
def overdue_loans(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    stmt = select(DressLoan).where(
        DressLoan.status == LoanStatus.OPEN,
        DressLoan.returned_at.is_(None),
        DressLoan.due_at < now,
    ).order_by(DressLoan.due_at.asc())
    return list(db.scalars(stmt).all())
