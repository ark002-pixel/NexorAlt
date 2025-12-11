from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from uuid import UUID
import models, database, auth
from datetime import datetime

router = APIRouter(
    prefix="/emergencies",
    tags=["emergencies"]
)

class AlertCreate(BaseModel):
    location: str
    type: models.EmergencyType
    description: Optional[str]

class AlertResponse(BaseModel):
    id: UUID
    location: str
    type: models.EmergencyType
    description: Optional[str]
    status: models.EmergencyStatus
    created_at: datetime

    class Config:
        orm_mode = True

class EquipmentResponse(BaseModel):
    id: UUID
    name: str
    serial_number: str
    type: models.EquipmentType
    status: models.EquipmentStatus
    is_rescue: bool

    class Config:
        orm_mode = True

@router.post("/alert", response_model=AlertResponse)
def create_alert(alert: AlertCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    new_alert = models.EmergencyAlert(
        user_id=current_user.id,
        location=alert.location,
        type=alert.type,
        description=alert.description
    )
    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)

    # Log Action
    from utils.audit import log_action
    log_action(
        db, 
        user_id=current_user.id, 
        action=models.AuditAction.CREATE, 
        resource_type=models.AuditResourceType.ALERT, 
        resource_id=str(new_alert.id), 
        details={"location": alert.location, "type": alert.type}
    )

    return new_alert

@router.get("/alerts", response_model=List[AlertResponse])
def get_alerts(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    # In a real scenario, maybe filter by location or role. For now, list all active alerts.
    return db.query(models.EmergencyAlert).filter(models.EmergencyAlert.status == models.EmergencyStatus.OPEN).all()

@router.get("/rescue-inventory", response_model=List[EquipmentResponse])
def get_rescue_inventory(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.Equipment).filter(models.Equipment.is_rescue == True).all()
