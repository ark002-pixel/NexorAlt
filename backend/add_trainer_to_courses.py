
from sqlalchemy import text
from database import engine

def add_trainer_column():
    with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as connection:
        try:
            print("Adding trainer_id column to courses table...")
            connection.execute(text("ALTER TABLE courses ADD COLUMN IF NOT EXISTS trainer_id UUID REFERENCES users(id)"))
            print("Column added successfully.")
        except Exception as e:
            print(f"Schema update info: {e}")

if __name__ == "__main__":
    add_trainer_column()
