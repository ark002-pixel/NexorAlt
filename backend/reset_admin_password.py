from database import SessionLocal
from models import User, UserRole
from auth import get_password_hash
import uuid

def reset_password():
    db = SessionLocal()
    try:
        # Try to find by document_id
        admin = db.query(User).filter(User.document_id == "123456789").first()
        
        if not admin:
            print("User 123456789 not found. Checking by email...")
            admin = db.query(User).filter(User.email == "admin@nexor.com").first()

        if not admin:
            print("Admin user not found at all. Creating new one...")
            admin = User(
                id=uuid.uuid4(),
                document_id="123456789",
                email="admin@nexor.com",
                full_name="Administrador Restablecido",
                role=UserRole.ADMIN,
                hashed_password=get_password_hash("admin123")
            )
            db.add(admin)
            print("Created new Admin user.")
        else:
            print(f"Found user: {admin.full_name} ({admin.document_id})")
            admin.hashed_password = get_password_hash("admin123")
            admin.role = UserRole.ADMIN # Ensure valid role
            admin.document_id = "123456789" # Ensure valid ID
            print("Password reset to: admin123")
            
        db.commit()
        print("Success.")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    reset_password()
