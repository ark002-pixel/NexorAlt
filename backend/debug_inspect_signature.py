from database import SessionLocal
import models
from sqlalchemy import text

def inspect_signature():
    db = SessionLocal()
    # Get any attendance record with a signature
    try:
        records = db.query(models.AttendanceRecord).filter(models.AttendanceRecord.signature_url.isnot(None)).all()
        print(f"Records with signatures: {len(records)}")
        for r in records:
            print(f"Record {r.id}: Enrollment {r.enrollment_id}, URL: {r.signature_url}")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    inspect_signature()
