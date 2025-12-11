from database import SessionLocal
from models import User
from auth import get_password_hash

db = SessionLocal()
user = db.query(User).filter(User.email == "admin@nexor.com").first()
if user:
    print(f"Resetting password for {user.email}...")
    user.hashed_password = get_password_hash("admin123")
    db.commit()
    print("Password reset successfully.")
else:
    print("User not found.")
db.close()
