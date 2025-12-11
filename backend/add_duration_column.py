from database import engine
from sqlalchemy import text

def migrate():
    with engine.connect() as conn:
        try:
            # Check if column exists is hard in generic SQL without inspecting schema
            # We'll just try to add it and catch exception if it fails (not ideal but quick for dev)
            # Better specific: Postgres syntax
            conn.execute(text("ALTER TABLE courses ADD COLUMN duration_days INTEGER DEFAULT 1"))
            conn.commit()
            print("Column duration_days added successfully.")
        except Exception as e:
            print(f"Migration failed (maybe column exists?): {e}")

if __name__ == "__main__":
    migrate()
