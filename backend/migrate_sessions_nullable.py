from database import engine
from sqlalchemy import text

def make_trainer_nullable():
    with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
        print("Altering practice_sessions table...")
        try:
            conn.execute(text("ALTER TABLE practice_sessions ALTER COLUMN trainer_id DROP NOT NULL"))
            print("Successfully made trainer_id nullable.")
        except Exception as e:
            print(f"Error altering table: {e}")

if __name__ == "__main__":
    make_trainer_nullable()
