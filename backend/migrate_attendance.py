from database import engine, Base
from models import AttendanceRecord

def migrate():
    print("Creating attendance_records table...")
    try:
        AttendanceRecord.__table__.create(bind=engine)
        print("Done.")
    except Exception as e:
        print(f"Error: {e}")
        # If error is about type existing, try to continue or check if table exists
        if "type \"attendancestatus\" already exists" in str(e):
             print("Enum type exists. This is fine if table creation continued or we retry.")

if __name__ == "__main__":
    migrate()
