from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db.session import get_db
from app.models.user import User
from app.models.dress import Dress, DressStatus
from app.models.dress_loan import DressLoan, LoanStatus
from app.schemas.dress_loan import LoanCreate, LoanOut, LoanReturn

from app.core.authz import get_current_user# <-- AJUSTAR según tu proyecto

router = APIRouter(prefix="/api/dress-loans", tags=["Dress Loans"])


@router.post("", response_model=LoanOut)
def create_loan(
    payload: LoanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ("ADMIN", "OPERATOR"):
        raise HTTPException(status_code=403, detail="Forbidden")

    dress = db.get(Dress, payload.dress_id)
    if not dress:
        raise HTTPException(status_code=404, detail="Dress not found")
    if dress.status != DressStatus.AVAILABLE:
        raise HTTPException(status_code=409, detail=f"Dress not available (status={dress.status})")

    open_loan = db.scalar(
        select(DressLoan).where(
            DressLoan.dress_id == payload.dress_id,
            DressLoan.status == LoanStatus.OPEN,
            DressLoan.returned_at.is_(None),
        )
    )
    if open_loan:
        raise HTTPException(status_code=409, detail="There is already an open loan for this dress")

    now = datetime.now(timezone.utc)

    if payload.due_at is None and payload.loan_days is None:
        raise HTTPException(status_code=422, detail="Provide due_at or loan_days")

    due_at = payload.due_at or (now + timedelta(days=int(payload.loan_days)))

    loan = DressLoan(
        dress_id=payload.dress_id,
        customer_name=payload.customer_name,
        customer_dni=payload.customer_dni,
        customer_phone=payload.customer_phone,
        customer_email=str(payload.customer_email) if payload.customer_email else None,
        event_name=payload.event_name,
        delivered_at=now,
        due_at=due_at,
        loan_days=payload.loan_days,
        delivered_by_user_id=current_user.id,
        picked_up_by=payload.picked_up_by,
        notes=payload.notes,
        status=LoanStatus.OPEN,
    )

    dress.status = DressStatus.LOANED
    db.add(loan)
    db.commit()
    db.refresh(loan)
    return loan


@router.post("/{loan_id}/return", response_model=LoanOut)
def return_loan(
    loan_id: int,
    payload: LoanReturn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ("ADMIN", "OPERATOR"):
        raise HTTPException(status_code=403, detail="Forbidden")

    loan = db.get(DressLoan, loan_id)
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    if loan.status != LoanStatus.OPEN or loan.returned_at is not None:
        raise HTTPException(status_code=409, detail="Loan is not open")

    now = datetime.now(timezone.utc)
    loan.returned_at = now
    loan.returned_by = payload.returned_by
    loan.received_by_user_id = current_user.id
    loan.status = LoanStatus.RETURNED

    dress = db.get(Dress, loan.dress_id)
    if dress:
        dress.status = DressStatus.AVAILABLE

    db.commit()
    db.refresh(loan)
    return loan


@router.get("", response_model=list[LoanOut])
def list_loans(
    status: LoanStatus | None = Query(default=None),
    overdue: bool = Query(default=False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(DressLoan)
    if status:
        stmt = stmt.where(DressLoan.status == status)

    if overdue:
        now = datetime.now(timezone.utc)
        stmt = stmt.where(
            DressLoan.status == LoanStatus.OPEN,
            DressLoan.returned_at.is_(None),
            DressLoan.due_at < now,
        )

    return list(db.scalars(stmt.order_by(DressLoan.id.desc())).all())
