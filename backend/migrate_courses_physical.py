from database import engine, Base
from sqlalchemy import text

def migrate():
    with engine.connect() as conn:
        try:
            # Add required_documents column (JSON text)
            conn.execute(text("ALTER TABLE courses ADD COLUMN IF NOT EXISTS required_documents VARCHAR"))
            conn.execute(text("ALTER TABLE courses ADD COLUMN IF NOT EXISTS start_date TIMESTAMP"))
            conn.execute(text("ALTER TABLE courses ADD COLUMN IF NOT EXISTS location VARCHAR"))
            conn.execute(text("ALTER TABLE courses ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 20"))
            
            print("Successfully added columns to courses table")
            conn.commit()
        except Exception as e:
            print(f"Error migrating: {e}")

if __name__ == "__main__":
    migrate()
