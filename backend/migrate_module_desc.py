from database import engine
from sqlalchemy import text

def migrate_modules():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE modules ADD COLUMN description VARCHAR"))
            conn.commit()
            print("Successfully added 'description' column to modules table.")
        except Exception as e:
            print(f"Migration might have failed or column exists: {e}")

if __name__ == "__main__":
    migrate_modules()
