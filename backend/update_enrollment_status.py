
import json
from sqlalchemy import text
from database import SessionLocal
from models import User, Document, Enrollment, EnrollmentStatus, DocumentStatus, UserRole

def update_statuses():
    db = SessionLocal()
    try:
        # Get all non-completed enrollments for students
        enrollments = db.query(Enrollment).join(User).filter(
            User.role == UserRole.STUDENT,
            Enrollment.status != EnrollmentStatus.COMPLETED
        ).all()
        
        print(f"Checking {len(enrollments)} active enrollments...")
        
        updated_count = 0
        
        for enrollment in enrollments:
            course = enrollment.course
            required_types = ["ID_CARD", "SOCIAL_SECURITY", "MEDICAL_CONCEPT"] # Default
            
            if course.required_documents:
                try:
                    required_types = json.loads(course.required_documents)
                except:
                    pass
            
            # Check docs linked to this enrollment
            # We strictly check docs with enrollment_id matching
            docs = db.query(Document).filter(
                Document.enrollment_id == enrollment.id,
                Document.status == DocumentStatus.APPROVED
            ).all()
            
            approved_types = [d.type for d in docs]
            
            # Check if all requirements are met
            # Using set subset check
            is_complete = set(required_types).issubset(set(approved_types))
            
            if is_complete and required_types:
                print(f"Enrollment {enrollment.id} (User: {enrollment.user.full_name}) -> COMPLETED")
                enrollment.status = EnrollmentStatus.COMPLETED
                updated_count += 1
            else:
                missing = set(required_types) - set(approved_types)
                # print(f"Enrollment {enrollment.id} NOT complete. Missing: {missing}")
                
        db.commit()
        print(f"Successfully updated {updated_count} enrollments to COMPLETED.")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    update_statuses()
