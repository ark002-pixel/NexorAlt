from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date as date_type, datetime
from pydantic import BaseModel
import models, database, auth
import uuid

router = APIRouter(
    prefix="/attendance",
    tags=["Attendance"]
)

class AttendanceUpdate(BaseModel):
    enrollment_id: str
    status: str
    signature_url: Optional[str] = None

class BatchAttendanceRequest(BaseModel):
    course_id: str
    date: date_type
    records: List[AttendanceUpdate]

@router.get("/{course_id}")
def get_attendance(
    course_id: str,
    date: date_type,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Determine the datetime range for the given date (00:00 to 23:59)
    # Actually, we can just filter by casting/truncating or exact match if logic ensures it
    # Ideally, we query enrollments for the course, and join with existing attendance records for that date.
    
    # 1. Get Enrollments
    enrollments = db.query(models.Enrollment).filter(
        models.Enrollment.course_id == course_id,
        # models.Enrollment.status == models.EnrollmentStatus.ENROLLED # Only active? Or all? -> Show ALL for now to fix visibility
    ).all()
    
    # 2. Get existing records for this date
    # Start of day
    start_of_day = datetime.combine(date, datetime.min.time())
    end_of_day = datetime.combine(date, datetime.max.time())
    
    records = db.query(models.AttendanceRecord).filter(
        models.AttendanceRecord.date >= start_of_day,
        models.AttendanceRecord.date <= end_of_day,
        models.AttendanceRecord.enrollment_id.in_([e.id for e in enrollments])
    ).all()
    
    records_map = {r.enrollment_id: r for r in records}
    
    result = []
    for e in enrollments:
        record = records_map.get(e.id)
        result.append({
            "enrollment_id": str(e.id),
            "student_id": str(e.user_id),
            "student_name": e.user.full_name,
            "student_document": e.user.document_id,
            "status": record.status if record else "PRESENT", # Default to Present? Or None?
            "signature_url": record.signature_url if record else None,
            "recorded": bool(record)
        })
        
    return result

@router.post("")
def save_attendance(
    req: BatchAttendanceRequest,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role not in [models.UserRole.TRAINER, models.UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    saved_count = 0
    
    # Timestamp for the record
    record_date = datetime.combine(req.date, datetime.min.time()) # Store as midnight
    
    for item in req.records:
        # Check if exists
        existing = db.query(models.AttendanceRecord).filter(
            models.AttendanceRecord.enrollment_id == item.enrollment_id,
            models.AttendanceRecord.date == record_date
        ).first()
        
        if existing:
            existing.status = item.status
            if item.signature_url:
                existing.signature_url = item.signature_url
            existing.trainer_id = current_user.id
        else:
            new_record = models.AttendanceRecord(
                id=uuid.uuid4(),
                enrollment_id=item.enrollment_id,
                trainer_id=current_user.id,
                date=record_date,
                status=item.status,
                signature_url=item.signature_url
            )
            db.add(new_record)
            saved_count += 1
            
    db.commit()
    return {"message": "Attendance saved", "new_records": saved_count}

import base64
import os

# Ensure signatures directory exists
SIGNATURE_DIR = "uploads/signatures"
os.makedirs(SIGNATURE_DIR, exist_ok=True)

class SignatureUploadRequest(BaseModel):
    enrollment_id: str
    date: date_type
    signature_base64: str

@router.post("/sign")
def upload_signature(
    req: SignatureUploadRequest,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role not in [models.UserRole.TRAINER, models.UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized")

    # 1. Decode Image
    try:
        # Expected format: "data:image/png;base64,iVBORw0KGgo..."
        if "," in req.signature_base64:
            header, encoded = req.signature_base64.split(",", 1)
        else:
            encoded = req.signature_base64
        
        data = base64.b64decode(encoded)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 signature")

    # 2. Save File
    filename = f"{req.enrollment_id}_{req.date.isoformat()}.png"
    file_path = os.path.join(SIGNATURE_DIR, filename)
    
    with open(file_path, "wb") as f:
        f.write(data)
        
    url = f"/uploads/signatures/{filename}"
    
    # 3. Update/Create Record
    # Timestamp for the record
    record_date = datetime.combine(req.date, datetime.min.time()) # Store as midnight
    
    existing = db.query(models.AttendanceRecord).filter(
        models.AttendanceRecord.enrollment_id == req.enrollment_id,
        models.AttendanceRecord.date == record_date
    ).first()
    
    if existing:
        existing.signature_url = url
        existing.trainer_id = current_user.id
        # Ensure status is at least present if signing
        if existing.status == models.AttendanceStatus.ABSENT:
             existing.status = models.AttendanceStatus.PRESENT
    else:
        new_record = models.AttendanceRecord(
            id=uuid.uuid4(),
            enrollment_id=req.enrollment_id,
            trainer_id=current_user.id,
            date=record_date,
            status=models.AttendanceStatus.PRESENT,
            signature_url=url
        )
        db.add(new_record)
        
    db.commit()
    
    return {"message": "Signature saved", "url": url}
