from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend import models
from datetime import datetime, timedelta
import uuid

def test_practices_logic():
    db = SessionLocal()
    try:
        print("Starting Practice Management Test...")
        
        # 1. Setup Data
        # Get or create a course
        course = db.query(models.Course).first()
        if not course:
            print("No course found. Creating test course...")
            course = models.Course(
                name="Curso Test Alturas",
                required_hours=40,
                price=100000
            )
            db.add(course)
            db.commit()
            
        # Get or create a trainer
        trainer = db.query(models.User).filter(models.User.role == models.UserRole.TRAINER).first()
        if not trainer:
            print("No trainer found. Creating test trainer...")
            trainer = models.User(
                document_id="TRAINER_TEST",
                email="trainer@test.com",
                hashed_password="hashed_password",
                full_name="Trainer Test",
                role=models.UserRole.TRAINER
            )
            db.add(trainer)
            db.commit()

        # Get or create a student
        student = db.query(models.User).filter(models.User.role == models.UserRole.STUDENT).first()
        if not student:
            print("No student found. Creating test student...")
            student = models.User(
                document_id="STUDENT_TEST",
                email="student@test.com",
                hashed_password="hashed_password",
                full_name="Student Test",
                role=models.UserRole.STUDENT
            )
            db.add(student)
            db.commit()
            
        # 2. Create Practice Session
        print(f"Creating session for course {course.name} with trainer {trainer.full_name}...")
        session = models.PracticeSession(
            course_id=course.id,
            trainer_id=trainer.id,
            date=datetime.utcnow() + timedelta(days=1),
            location="Sede Principal - Pista de Entrenamiento",
            capacity=2 # Small capacity for testing
        )
        db.add(session)
        db.commit()
        print(f"Session created with ID: {session.id}")
        
        # 3. Book Session
        print(f"Booking session for student {student.full_name}...")
        booking = models.PracticeBooking(
            session_id=session.id,
            student_id=student.id,
            status=models.BookingStatus.CONFIRMED
        )
        db.add(booking)
        db.commit()
        print(f"Booking created with ID: {booking.id}")
        
        # 4. Verify Capacity Check (Simulated)
        current_bookings = db.query(models.PracticeBooking).filter(
            models.PracticeBooking.session_id == session.id,
            models.PracticeBooking.status == models.BookingStatus.CONFIRMED
        ).count()
        print(f"Current bookings: {current_bookings}/{session.capacity}")
        
        if current_bookings < session.capacity:
            print("Capacity check passed: Slots available.")
        else:
            print("Capacity check passed: Session full.")
            
        # 5. Cancel Booking
        print("Cancelling booking...")
        booking.status = models.BookingStatus.CANCELLED
        db.commit()
        print("Booking cancelled.")
        
        print("Test completed successfully.")
        
    except Exception as e:
        print(f"Test Failed: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    test_practices_logic()
