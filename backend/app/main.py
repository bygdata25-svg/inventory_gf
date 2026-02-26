from app.models import fabric  # noqa: F401
from app.models import roll    # noqa: F401
from app.models import dress, dress_loan  # noqa: F401
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes.fabrics import router as fabrics_router
from app.api.routes.rolls import router as rolls_router
from app.api.routes.stock_movements import router as stock_movements_router
from app.api.routes.auth import router as auth_router
from app.api.routes.reports import router as reports_router
from app.api.routes.suppliers import router as suppliers_router
from app.db.session import engine, Base
# 👇 IMPORTANTE: importar todos los modelos
from app.models import fabric
from app.models import roll
from app.models import stock_movement
from app.models import supplier
from app.models import user
from app.api.dresses import router as dresses_router
from app.api.dress_loans import router as dress_loans_router
from app.api.alerts import router as alerts_router



app = FastAPI(title="Fabrics Inventory API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://inventory-gf-fe.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def create_tables():
    Base.metadata.create_all(bind=engine)

@app.get("/api/health")
def health():
    return {"status": "ok"}

app.include_router(fabrics_router, prefix="/api")
app.include_router(rolls_router)
app.include_router(stock_movements_router, prefix="/api")
app.include_router(auth_router)
app.include_router(reports_router)
app.include_router(suppliers_router, prefix="/api")
app.include_router(dresses_router)
app.include_router(dress_loans_router)
app.include_router(alerts_router)
