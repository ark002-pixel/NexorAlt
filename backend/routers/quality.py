from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from uuid import UUID
import models, database, auth
from datetime import datetime

router = APIRouter(
    prefix="/quality",
    tags=["quality"]
)

# Schemas (Internal for now, or move to schemas.py if reused)
class PQRSFCreate(BaseModel):
    type: models.PQRSFType
    subject: str
    description: str

class PQRSFResponse(BaseModel):
    id: UUID
    type: models.PQRSFType
    subject: str
    description: str
    status: models.PQRSFStatus
    response: Optional[str]
    created_at: datetime

    class Config:
        orm_mode = True

class SurveyCreate(BaseModel):
    course_id: Optional[UUID]
    rating: int
    comments: Optional[str]

# Endpoints

@router.post("/pqrsf", response_model=PQRSFResponse)
def create_pqrsf(pqrsf: PQRSFCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    new_pqrsf = models.PQRSF(
        user_id=current_user.id,
        type=pqrsf.type,
        subject=pqrsf.subject,
        description=pqrsf.description
    )
    db.add(new_pqrsf)
    db.commit()
    db.refresh(new_pqrsf)
    return new_pqrsf

@router.get("/pqrsf", response_model=List[PQRSFResponse])
def get_pqrsf(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role == models.UserRole.ADMIN:
        return db.query(models.PQRSF).all()
    else:
        return db.query(models.PQRSF).filter(models.PQRSF.user_id == current_user.id).all()

@router.post("/survey")
def submit_survey(survey: SurveyCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    new_survey = models.Survey(
        user_id=current_user.id,
        course_id=survey.course_id,
        rating=survey.rating,
        comments=survey.comments
    )
    db.add(new_survey)
    db.commit()
    return {"status": "submitted"}
