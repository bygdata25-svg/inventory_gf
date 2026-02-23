from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db.session import get_db
from app.models.user import User
from app.core.security import verify_password, create_access_token, hash_password
from app.core.authz import require_admin
from app.schemas.user import UserCreate, UserOut
from app.core.authz import get_current_user
from app.schemas.user import UserOut

router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginRequest(BaseModel):
    username: str
    password: str


@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.execute(select(User).where(User.username == payload.username)).scalar_one_or_none()

    if (not user) or (not user.is_active) or (not verify_password(payload.password, user.password_hash)):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": user.username, "role": user.role})
    return {"access_token": token, "token_type": "bearer", "role": user.role}


@router.post("/users", response_model=UserOut)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    existing = db.execute(select(User).where(User.username == payload.username)).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    u = User(
        username=payload.username,
        password_hash=hash_password(payload.password),
        role=payload.role,
        is_active=True,
    )

    db.add(u)
    db.commit()
    db.refresh(u)
    return u


@router.get("/users", response_model=list[UserOut])
def list_users(
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    items = db.execute(select(User).order_by(User.id.desc())).scalars().all()
    return items

@router.get("/me", response_model=UserOut)
def me(user=Depends(get_current_user)):
    return user

