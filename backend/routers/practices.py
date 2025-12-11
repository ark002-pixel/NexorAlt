from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from datetime import datetime

import models, schemas, database, auth

router = APIRouter(
    prefix="/practices",
    tags=["practices"]
)

@router.get("/", response_model=List[schemas.PracticeSessionResponse])
def get_practice_sessions(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    sessions = db.query(models.PracticeSession).offset(skip).limit(limit).all()
    
    # Attach booking counts
    results = []
    for session in sessions:
        count = db.query(models.PracticeBooking).filter(
            models.PracticeBooking.session_id == session.id,
            models.PracticeBooking.status == models.BookingStatus.CONFIRMED
        ).count()
        
        # Create response object manually or use Pydantic's from_orm and update
        session_data = schemas.PracticeSessionResponse.from_orm(session)
        session_data.bookings_count = count
        results.append(session_data)
        
    return results

@router.post("/", response_model=schemas.PracticeSessionResponse)
def create_practice_session(
    session: schemas.PracticeSessionCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role not in [models.UserRole.ADMIN, models.UserRole.TRAINER]:
        raise HTTPException(status_code=403, detail="Not authorized to create sessions")
    
    db_session = models.PracticeSession(**session.dict(), trainer_id=current_user.id)
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

@router.post("/{session_id}/book", response_model=schemas.BookingResponse)
def book_session(
    session_id: UUID,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Check if session exists
    session = db.query(models.PracticeSession).filter(models.PracticeSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Check capacity
    current_bookings = db.query(models.PracticeBooking).filter(
        models.PracticeBooking.session_id == session_id,
        models.PracticeBooking.status == models.BookingStatus.CONFIRMED
    ).count()
    
    if current_bookings >= session.capacity:
        raise HTTPException(status_code=400, detail="Session is full")
    
    # Check if already booked
    existing_booking = db.query(models.PracticeBooking).filter(
        models.PracticeBooking.session_id == session_id,
        models.PracticeBooking.student_id == current_user.id,
        models.PracticeBooking.status == models.BookingStatus.CONFIRMED
    ).first()
    
    if existing_booking:
        raise HTTPException(status_code=400, detail="Already booked for this session")
    
    # Create booking
    booking = models.PracticeBooking(
        session_id=session_id,
        student_id=current_user.id,
        status=models.BookingStatus.CONFIRMED
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking

@router.delete("/bookings/{booking_id}")
def cancel_booking(
    booking_id: UUID,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    booking = db.query(models.PracticeBooking).filter(models.PracticeBooking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.student_id != current_user.id and current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to cancel this booking")
    
    booking.status = models.BookingStatus.CANCELLED
    db.commit()
    return {"message": "Booking cancelled"}

@router.post("/checkin", response_model=schemas.BookingResponse)
def check_in_student(
    booking_id: UUID = Body(..., embed=True),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role not in [models.UserRole.ADMIN, models.UserRole.TRAINER]:
        raise HTTPException(status_code=403, detail="Not authorized to perform check-in")

    booking = db.query(models.PracticeBooking).filter(models.PracticeBooking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.status != models.BookingStatus.CONFIRMED:
        raise HTTPException(status_code=400, detail=f"Booking is {booking.status}, cannot check-in")

    booking.status = models.BookingStatus.ATTENDED
    db.commit()
    db.refresh(booking)
    
    # Log Action
    from utils.audit import log_action
    log_action(
        db, 
        user_id=current_user.id, 
        action=models.AuditAction.UPDATE, 
        resource_type=models.AuditResourceType.CERTIFICATE, # Using CERTIFICATE as proxy for practice/training
        resource_id=str(booking.id), 
        details={"action": "CHECK_IN", "student_id": str(booking.student_id)}
    )
    
    return booking
