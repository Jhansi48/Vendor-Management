import os
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import text
from .database import engine, Base, get_db
from .config import settings

# Import routers
from .routes import auth, users, vendors, procurement, purchase_orders, performance, reliability, contracts, communications, notifications, reports, dashboard, audit_logs

# Create tables only if using SQLite in local development (production uses Alembic migrations)
if engine.url.drivername == "sqlite" and settings.ENV_MODE.lower() not in ("production", "prod"):
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"Error creating SQLite tables: {e}")

app = FastAPI(
    title="VendorIQ API",
    description="Vendor Reliability Intelligence & Procurement Risk Management Platform API",
    version="1.0.0"
)

# Ensure configured uploads directory exists and mount static serving
os.makedirs(settings.avatars_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Dynamic CORS configuration from environment (wildcard forbidden in production)
cors_origins = settings.parsed_cors_origins
if not cors_origins:
    cors_origins = ["http://localhost:4200", "http://localhost:80", "http://localhost"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers under /api
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(vendors.router, prefix="/api")
app.include_router(procurement.router, prefix="/api")
app.include_router(purchase_orders.router, prefix="/api")
app.include_router(performance.router, prefix="/api")
app.include_router(reliability.router, prefix="/api")
app.include_router(contracts.router, prefix="/api")
app.include_router(communications.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(audit_logs.router, prefix="/api")

@app.get("/health")
@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    try:
        # Check database connection
        db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "database": "connected",
            "mode": settings.ENV_MODE
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database connection error: {str(e)}"
        )
