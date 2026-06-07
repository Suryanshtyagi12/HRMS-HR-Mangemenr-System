import os
from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import (
    auth, employees, attendance, payroll,
    leave, performance, recruitment,
    dashboard, ai, notifications, audit, reports
)

logger = logging.getLogger(__name__)

IS_PRODUCTION = os.getenv("ENVIRONMENT", "development").lower() == "production"


from app.ai.gemini_client import verify_models
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime
from app.services.auto_payroll import run_payroll_auto, is_last_working_day
from app.database import SessionLocal

scheduler = BackgroundScheduler()

def scheduled_payroll_check():
    """Runs every day at 6 PM"""
    today = datetime.utcnow()
    if is_last_working_day(today):
        print(f"Today is last working day. Running auto payroll...")
        db = SessionLocal()
        try:
            result = run_payroll_auto(db)
            print(f"Auto payroll result: {result}")
        finally:
            db.close()

scheduler.add_job(
    scheduled_payroll_check,
    'cron',
    hour=18,  # 6 PM UTC daily
    minute=0
)

def scheduled_audit_log_cleanup():
    """Runs every day at 2 AM to clean up old audit logs (older than 90 days)"""
    from datetime import timedelta
    from app.models.audit import AuditLog
    
    cutoff_date = datetime.utcnow() - timedelta(days=90)
    print(f"Running audit log cleanup... Deleting logs older than {cutoff_date.date()}")
    db = SessionLocal()
    try:
        deleted_count = db.query(AuditLog).filter(AuditLog.created_at < cutoff_date).delete()
        db.commit()
        print(f"Audit log cleanup finished. Deleted {deleted_count} old records.")
    except Exception as e:
        db.rollback()
        print(f"Error during audit log cleanup: {e}")
    finally:
        db.close()

scheduler.add_job(
    scheduled_audit_log_cleanup,
    'cron',
    hour=2,  # 2 AM UTC daily
    minute=0
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup / shutdown events."""
    logger.info("HRMS Pro API starting up…")
    verify_models()
    scheduler.start()
    print("✓ Auto payroll scheduler started")
    print("  Runs daily at 6PM — triggers on last working day")
    print("✓ Audit log cleanup scheduler started")
    print("  Runs daily at 2AM — deletes logs > 90 days old")
    yield
    scheduler.shutdown()
    logger.info("HRMS Pro API shutting down…")


app = FastAPI(
    title="HRMS Pro API",
    description="AI-Powered Human Resource Management System — FastAPI Backend",
    version="2.0.0",
    # Disable interactive docs in production for security
    docs_url=None if IS_PRODUCTION else "/docs",
    redoc_url=None if IS_PRODUCTION else "/redoc",
    openapi_url=None if IS_PRODUCTION else "/openapi.json",
    lifespan=lifespan,
)

# ──────────────────────────────────────────────────────────────
# CORS — allow Next.js frontend only
# ──────────────────────────────────────────────────────────────
_allowed_origins = [
    settings.FRONTEND_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
# Allow production Vercel URL if set
_vercel_url = os.getenv("VERCEL_FRONTEND_URL", "")
if _vercel_url:
    _allowed_origins.append(_vercel_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "X-Requested-With"],
)

# ──────────────────────────────────────────────────────────────
# Routers
# ──────────────────────────────────────────────────────────────
app.include_router(auth.router,          prefix="/auth",          tags=["Auth"])
app.include_router(employees.router,     prefix="/employees",     tags=["Employees"])
app.include_router(attendance.router,    prefix="/attendance",    tags=["Attendance"])
app.include_router(payroll.router,       prefix="/payroll",       tags=["Payroll"])
app.include_router(leave.router,         prefix="/leave",         tags=["Leave"])
app.include_router(performance.router,   prefix="/performance",   tags=["Performance"])
app.include_router(recruitment.router,   prefix="/recruitment",   tags=["Recruitment"])
app.include_router(dashboard.router,     prefix="/dashboard",     tags=["Dashboard"])
app.include_router(ai.router,            prefix="/ai",            tags=["AI"])
app.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
app.include_router(audit.router,         prefix="/audit",         tags=["Audit"])
app.include_router(reports.router,       prefix="/reports",       tags=["Reports"])
from app.routers import onboarding, documents
app.include_router(onboarding.router,    prefix="/onboarding",    tags=["Onboarding"])
app.include_router(documents.router,     prefix="/documents",     tags=["Documents"])


# ──────────────────────────────────────────────────────────────
# Root endpoints
# ──────────────────────────────────────────────────────────────
@app.get("/", tags=["Root"])
def root():
    return {
        "status": "HRMS Pro API running",
        "version": "2.0.0",
        "docs": "/docs",
    }


@app.get("/health", tags=["Root"])
def health():
    return {"status": "healthy"}
