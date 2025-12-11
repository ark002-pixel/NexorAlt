from database import SessionLocal
import models
from sqlalchemy import text

def inspect_courses():
    db = SessionLocal()
    try:
        print("--- QUERYING ALL COURSES ---")
        courses = db.query(models.Course).all()
        print(f"Total Courses Found: {len(courses)}")
        
        print("\n--- DETAILED LIST ---")
        print(f"{'ID':<36} | {'NAME':<30} | {'LOCATION':<15} | {'START_DATE':<20} | {'TYPE'}")
        print("-" * 120)
        
        for c in courses:
            loc = str(c.location) if c.location else "None"
            sdate = str(c.start_date) if c.start_date else "None"
            print(f"{str(c.id):<36} | {c.name[:30]:<30} | {loc:<15} | {sdate:<20} | {c.type}")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    inspect_courses()
