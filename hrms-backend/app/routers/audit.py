from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional

from app.database import get_db
from app.dependencies import require_admin, get_current_user
from app.models.audit import AuditLog
from app.schemas.audit import AuditLogResponse

router = APIRouter()

@router.get("/health")
def health():
    return {"status": "ok", "module": "audit"}

@router.get("")
def get_audit_logs(
    page: int = 1,
    limit: int = 50,
    action: Optional[str] = None,
    entity: Optional[str] = None,
    user_id: Optional[str] = Query(None, alias="userId"),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        query = db.query(AuditLog)
        
        if action and action != "ALL":
            query = query.filter(AuditLog.action == action)
        if entity and entity != "ALL":
            query = query.filter(AuditLog.entity == entity)
        if user_id:
            query = query.filter(AuditLog.user_id == user_id)
            
        # Row-Level Security
        if current_user.role == "EMPLOYEE":
            query = query.filter(AuditLog.user_id == current_user.id)
        elif current_user.role == "SENIOR_MANAGER":
            # Just show logs related to the manager for now
            query = query.filter(AuditLog.user_id == current_user.id)
            
        total = query.count()
        
        offset = (page - 1) * limit
        items = query.order_by(desc(AuditLog.created_at)).offset(offset).limit(limit).all()
        
        # Get unique filters
        all_actions = [r[0] for r in db.query(AuditLog.action).distinct().all()]
        all_entities = [r[0] for r in db.query(AuditLog.entity).distinct().all()]
        
        return {
            "logs": [AuditLogResponse.model_validate(i).model_dump() for i in items],
            "total": total,
            "totalPages": (total + limit - 1) // limit,
            "filters": {
                "actions": [a for a in all_actions if a],
                "entities": [e for e in all_entities if e]
            }
        }
    except Exception as e:
        print(f"Error fetching audit logs: {e}")
        return {"logs": [], "total": 0, "totalPages": 1, "filters": {"actions": [], "entities": []}}
