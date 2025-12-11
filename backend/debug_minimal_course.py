from database import SessionLocal
import models
import traceback  # Import traceback module

def debug_orm():
    db = SessionLocal()
    try:
        print("Querying all courses...")
        courses = db.query(models.Course).all()
        print(f"Found {len(courses)} courses.")
        for c in courses:
            print(f"ID: {c.id}, Name: {c.name}, Duration: {c.duration_days}")
            # Try accessing modules
            print(f"Modules: {len(c.modules)}")
    except Exception:
        print("ORM Error:")
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    debug_orm()
