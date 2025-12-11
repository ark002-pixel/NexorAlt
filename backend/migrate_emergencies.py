from database import engine
from sqlalchemy import text

def migrate_emergencies():
    with engine.connect() as conn:
        try:
            # Add is_rescue column to equipment table
            conn.execute(text("ALTER TABLE equipment ADD COLUMN is_rescue BOOLEAN DEFAULT FALSE"))
            print("Added is_rescue column to equipment table.")
            conn.commit()
        except Exception as e:
            print(f"Error adding column (might already exist): {e}")

if __name__ == "__main__":
    migrate_emergencies()
