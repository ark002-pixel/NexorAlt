from database import SessionLocal
import models

def list_students():
    db = SessionLocal()
    students = db.query(models.User).filter(models.User.role == models.UserRole.STUDENT).all()
    print(f"Total Students: {len(students)}")
    for s in students:
        print(f"ID: {s.id} | Name: {s.full_name} | Doc: {s.document_id}")
    db.close()

if __name__ == "__main__":
    list_students()
