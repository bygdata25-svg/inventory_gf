from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.authz import get_current_user
from app.db.session import get_db
from app.models.supplier import Supplier
from app.schemas.supplier import SupplierCreate, SupplierOut

router = APIRouter(prefix="/suppliers", tags=["suppliers"])

def require_admin(user):
    # Asumimos que tu User tiene atributo .role con valores "ADMIN" / "OPERATOR"
    if getattr(user, "role", None) != "ADMIN":
        raise HTTPException(status_code=403, detail="Forbidden")

@router.get("", response_model=list[SupplierOut])
def list_suppliers(
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    rows = db.execute(select(Supplier).order_by(Supplier.name.asc())).scalars().all()
    return rows

@router.post("", response_model=SupplierOut)
def create_supplier(
    data: SupplierCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    require_admin(user)

    name = data.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Name is required")

    exists = db.execute(select(Supplier).where(Supplier.name == name)).scalar_one_or_none()
    if exists:
        raise HTTPException(status_code=400, detail={"messageKey": "errors.supplierNameExists", "params": {"name": name}})

    s = Supplier(
        name=name,
        phone=(data.phone.strip() if data.phone else None),
        email=(str(data.email).strip() if data.email else None),
        notes=(data.notes.strip() if data.notes else None),
        is_active=data.is_active,
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return s

@router.delete("/{supplier_id}")
def delete_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    require_admin(user)

    s = db.execute(select(Supplier).where(Supplier.id == supplier_id)).scalar_one_or_none()
    if not s:
        raise HTTPException(status_code=404, detail="Not found")

    db.delete(s)
    db.commit()
    return {"ok": True}

