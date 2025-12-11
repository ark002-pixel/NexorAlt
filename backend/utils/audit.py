from sqlalchemy.orm import Session
from uuid import UUID
import models
import json

def log_action(db: Session, user_id: UUID, action: models.AuditAction, resource_type: models.AuditResourceType, resource_id: str = None, details: dict = None):
    """
    Creates an audit log entry.
    """
    try:
        details_str = json.dumps(details) if details else None
        
        new_log = models.AuditLog(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=str(resource_id) if resource_id else None,
            details=details_str
        )
        db.add(new_log)
        db.commit()
    except Exception as e:
        print(f"Failed to create audit log: {e}")
        # Don't raise exception to avoid breaking the main flow
        db.rollback()
