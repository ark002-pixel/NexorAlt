from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from datetime import datetime

import models, schemas, database, auth

router = APIRouter(
    prefix="/inventory",
    tags=["inventory"]
)

@router.get("/", response_model=List[schemas.EquipmentResponse])
def get_equipment(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    equipment = db.query(models.Equipment).offset(skip).limit(limit).all()
    return equipment

@router.post("/", response_model=schemas.EquipmentResponse)
def create_equipment(
    equipment: schemas.EquipmentCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role not in [models.UserRole.ADMIN, models.UserRole.TRAINER]:
        raise HTTPException(status_code=403, detail="Not authorized to create equipment")
    
    db_equipment = models.Equipment(**equipment.dict())
    db.add(db_equipment)
    db.commit()
    db.refresh(db_equipment)
    return db_equipment

@router.post("/{equipment_id}/inspect", response_model=schemas.InspectionResponse)
def inspect_equipment(
    equipment_id: UUID,
    inspection: schemas.InspectionCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role not in [models.UserRole.ADMIN, models.UserRole.TRAINER]:
        raise HTTPException(status_code=403, detail="Not authorized to inspect equipment")
    
    equipment = db.query(models.Equipment).filter(models.Equipment.id == equipment_id).first()
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")
    
    # Create inspection
    db_inspection = models.Inspection(
        **inspection.dict(),
        inspector_id=current_user.id,
        date=datetime.utcnow()
    )
    db.add(db_inspection)
    
    # Update equipment status if failed
    if inspection.result == "FAIL":
        equipment.status = models.EquipmentStatus.DAMAGED
    
    equipment.last_inspection_date = datetime.utcnow()
    
    db.commit()
    db.refresh(db_inspection)
    return db_inspection
