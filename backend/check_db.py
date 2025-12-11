from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend import models

def check_db():
    db = SessionLocal()
    try:
        modules = db.query(models.Module).all()
        print(f"Total modules: {len(modules)}")
        for m in modules:
            print(f"Module: {m.title}, Has Quiz: {m.has_quiz}, Questions: {len(m.questions)}")
    finally:
        db.close()

if __name__ == "__main__":
    check_db()
