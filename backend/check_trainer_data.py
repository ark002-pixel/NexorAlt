from database import SessionLocal
from models import User, UserRole
from datetime import datetime

def inspect_trainers():
    db = SessionLocal()
    try:
        trainers = db.query(User).filter(User.role == UserRole.TRAINER).all()
        print(f"Found {len(trainers)} trainers.")
        print("-" * 50)
        for t in trainers:
            print(f"Name: {t.full_name}")
            print(f"ID: {t.document_id}")
            print(f"License Expiration (Raw): {t.license_expiration}")
            
            if t.license_expiration:
                is_expired = t.license_expiration < datetime.utcnow()
                print(f"Expired?: {'YES' if is_expired else 'NO'} (UTC Now: {datetime.utcnow()})")
            else:
                print("Expired?: N/A (Field is NULL)")
            print("-" * 50)
    finally:
        db.close()

if __name__ == "__main__":
    inspect_trainers()
