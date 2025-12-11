from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
import models, database, auth

router = APIRouter(
    prefix="/audit",
    tags=["audit"]
)

class AuditLogResponse(BaseModel):
    id: UUID
    user_id: Optional[UUID]
    action: models.AuditAction
    resource_type: models.AuditResourceType
    resource_id: Optional[str]
    details: Optional[str]
    timestamp: datetime
    user_name: Optional[str] = None

    class Config:
        orm_mode = True

@router.get("/logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    logs = db.query(models.AuditLog).order_by(models.AuditLog.timestamp.desc()).offset(skip).limit(limit).all()
    
    # Enrich with user name manually if needed, or rely on frontend to fetch/display
    # For simplicity, we'll just return the logs. The frontend can look up user names or we can join.
    # Let's do a simple join or map for better UX
    response = []
    for log in logs:
        log_dict = {
            "id": log.id,
            "user_id": log.user_id,
            "action": log.action,
            "resource_type": log.resource_type,
            "resource_id": log.resource_id,
            "details": log.details,
            "timestamp": log.timestamp,
            "user_name": log.user.full_name if log.user else "System/Unknown"
        }
        response.append(log_dict)
        
    return response
