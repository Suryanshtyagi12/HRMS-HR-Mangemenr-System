from pydantic import BaseModel
from typing import Optional, Any, Dict
from datetime import datetime
from app.schemas.user import UserResponse

class AuditLogResponse(BaseModel):
    id: str
    user_id: Optional[str]
    action: str
    entity: Optional[str]
    entity_id: Optional[str]
    old_values: Optional[Dict[str, Any]]
    new_values: Optional[Dict[str, Any]]
    ip_address: Optional[str]
    user_agent: Optional[str]
    created_at: datetime
    
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True
