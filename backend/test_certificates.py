from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend import models
from datetime import datetime, timedelta
import uuid

def test_certificates_logic():
    db = SessionLocal()
    try:
        print("Starting Certification Module Test...")
        
        # 1. Setup Data
        # Get Admin (Issuer)
        admin = db.query(models.User).filter(models.User.role == models.UserRole.ADMIN).first()
        if not admin:
            print("Admin not found.")
            return

        # Get Student (Recipient)
        student = db.query(models.User).filter(models.User.role == models.UserRole.STUDENT).first()
        if not student:
            print("Student not found.")
            return
            
        # Get Course
        course = db.query(models.Course).first()
        if not course:
            print("Course not found.")
            return

        # 2. Issue Certificate
        print(f"Issuing certificate for {student.full_name} in course {course.name}...")
        
        # Generate Code
        cert_code = f"TEST-CERT-{uuid.uuid4().hex[:6].upper()}"
        
        cert = models.Certification(
            user_id=student.id,
            course_id=course.id,
            issue_date=datetime.utcnow(),
            expiration_date=datetime.utcnow() + timedelta(days=365),
            certificate_code=cert_code,
            pdf_url=f"https://mock.com/{cert_code}.pdf"
        )
        db.add(cert)
        db.commit()
        print(f"Certificate issued with Code: {cert_code}")
        
        # 3. Validate Certificate
        print(f"Validating code {cert_code}...")
        found_cert = db.query(models.Certification).filter(models.Certification.certificate_code == cert_code).first()
        
        if found_cert:
            print("Validation Successful: Certificate found.")
            print(f"Owner: {student.full_name}")
            print(f"Course: {course.name}")
        else:
            print("Validation Failed: Certificate not found.")
            
        print("Test completed successfully.")
        
    except Exception as e:
        print(f"Test Failed: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    test_certificates_logic()
