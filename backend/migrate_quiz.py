from sqlalchemy import text
from backend.database import engine

def migrate():
    with engine.connect() as conn:
        print("Starting manual migration...")
        
        # Add columns to modules table if they don't exist
        try:
            conn.execute(text("ALTER TABLE modules ADD COLUMN IF NOT EXISTS has_quiz BOOLEAN DEFAULT FALSE"))
            conn.execute(text("ALTER TABLE modules ADD COLUMN IF NOT EXISTS passing_score INTEGER DEFAULT 80"))
            print("Added columns to modules table.")
        except Exception as e:
            print(f"Error altering modules table: {e}")

        # Create questions table
        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS questions (
                    id UUID PRIMARY KEY,
                    module_id UUID NOT NULL REFERENCES modules(id),
                    text VARCHAR NOT NULL,
                    options VARCHAR NOT NULL,
                    correct_option_index INTEGER NOT NULL
                )
            """))
            print("Created questions table.")
        except Exception as e:
            print(f"Error creating questions table: {e}")

        # Create quiz_attempts table
        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS quiz_attempts (
                    id UUID PRIMARY KEY,
                    user_id UUID NOT NULL REFERENCES users(id),
                    module_id UUID NOT NULL REFERENCES modules(id),
                    score INTEGER NOT NULL,
                    passed BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """))
            print("Created quiz_attempts table.")
        except Exception as e:
            print(f"Error creating quiz_attempts table: {e}")
            
        conn.commit()
        print("Migration completed.")

if __name__ == "__main__":
    migrate()
