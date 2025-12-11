from database import SessionLocal
import models

def check_modules():
    db = SessionLocal()
    try:
        courses = db.query(models.Course).all()
        print(f"Total Courses: {len(courses)}")
        
        for c in courses:
            count = db.query(models.Module).filter(models.Module.course_id == c.id).count()
            print(f"Course: {c.name} (ID: {c.id}) - Modules: {count}")
            if count > 0:
                mods = db.query(models.Module).filter(models.Module.course_id == c.id).limit(3).all()
                for m in mods:
                     print(f"  - {m.title} ({m.description[:30]}...)")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_modules()
