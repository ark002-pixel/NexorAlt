from database import SessionLocal
import models

def check():
    db = SessionLocal()
    users = db.query(models.User).all()
    print(f"Found {len(users)} users.")
    for u in users:
        print(f"ID: {u.document_id}, Email: {u.email}, Role: {u.role}")

if __name__ == "__main__":
    check()
