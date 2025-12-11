from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from uuid import UUID
import models, database, auth
from utils.permit_generator import generate_permit_pdf
from datetime import datetime

router = APIRouter(
    prefix="/simulator",
    tags=["simulator"]
)

class WorkPermitCreate(BaseModel):
    location: str
    task_description: str
    hazards: str
    precautions: str

class WorkPermitResponse(BaseModel):
    id: UUID
    location: str
    task_description: str
    status: models.WorkPermitStatus
    pdf_url: Optional[str]
    created_at: datetime

    class Config:
        orm_mode = True

@router.post("/permit", response_model=WorkPermitResponse)
def create_permit(permit: WorkPermitCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    new_permit = models.WorkPermit(
        user_id=current_user.id,
        location=permit.location,
        task_description=permit.task_description,
        hazards=permit.hazards,
        precautions=permit.precautions
    )
    db.add(new_permit)
    db.commit()
    db.refresh(new_permit)

    # Generate PDF
    try:
        pdf_path = generate_permit_pdf(new_permit, current_user)
        new_permit.pdf_url = pdf_path
        db.commit()
    except Exception as e:
        print(f"Error generating PDF: {e}")

    return new_permit

@router.get("/permits", response_model=List[WorkPermitResponse])
def get_permits(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.WorkPermit).filter(models.WorkPermit.user_id == current_user.id).all()
