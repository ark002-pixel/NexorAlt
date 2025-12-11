from database import engine
from sqlalchemy import text

def migrate():
    with engine.connect() as conn:
        try:
            # 1. Add Column
            conn.execute(text("ALTER TABLE courses ADD COLUMN IF NOT EXISTS code VARCHAR;"))
            print("Added 'code' column.")
            
            # 2. Add Constraint (Optional, better to do via Index)
            # We want it unique, but existing rows might be null.
            # Postgres allows multiple NULLs in UNIQUE index.
            conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_courses_code ON courses (code);"))
            print("Added unique index.")
            
            conn.commit()
            print("Migration successful.")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    migrate()
