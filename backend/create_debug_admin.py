
from database import SessionLocal
import models, auth

import uuid

def create_debug_admin():
    db = SessionLocal()
    try:
        # Check if debug admin exists
        user = db.query(models.User).filter(models.User.document_id == "99999").first()
        if user:
            print("Debug user '99999' already exists. Deleting to recreate...")
            db.delete(user)
            db.commit()
        
        print("Creating Debug Admin '99999' with password 'debug123'...")
        new_admin = models.User(
            id=uuid.uuid4(),
            document_id="99999",
            email="debug@admin.com",
            full_name="Debug Admin",
            hashed_password=auth.get_password_hash("debug123"),
            role=models.UserRole.ADMIN
        )
        db.add(new_admin)
        db.commit()
        print("SUCCESS: Debug Admin Created.")
    except Exception as e:
        print(f"ERROR: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_debug_admin()
