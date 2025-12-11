from sqlalchemy.orm import Session
from database import SessionLocal
import models
from datetime import datetime

def list_courses():
    db = SessionLocal()
    try:
        courses = db.query(models.Course).all()
        print(f"Total Courses: {len(courses)}")
        print("-" * 60)
        print(f"{'ID':<36} | {'Name':<30} | {'Start Date':<12} | {'State'}")
        print("-" * 60)
        
        current_date = datetime.utcnow()
        
        for c in courses:
            start = c.start_date.strftime("%Y-%m-%d") if c.start_date else "None"
            # Logic from frontend filter?
            # active: start_date >= today OR duration logic?
            print(f"{c.id} | {c.name[:30]:<30} | {start:<12} | Duration: {c.duration_days}")
            
    finally:
        db.close()

if __name__ == "__main__":
    list_courses()
