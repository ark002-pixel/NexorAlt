from backend.database import engine
from sqlalchemy import text

def migrate_practices():
    with engine.connect() as conn:
        print("Starting migration for Practice Management...")
        
        # Create practice_sessions table
        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS practice_sessions (
                    id UUID PRIMARY KEY,
                    course_id UUID NOT NULL REFERENCES courses(id),
                    trainer_id UUID NOT NULL REFERENCES users(id),
                    date TIMESTAMP WITHOUT TIME ZONE NOT NULL,
                    location VARCHAR NOT NULL,
                    capacity INTEGER DEFAULT 10,
                    status VARCHAR DEFAULT 'SCHEDULED',
                    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() at time zone 'utc')
                )
            """))
            print("Created practice_sessions table.")
        except Exception as e:
            print(f"Error creating practice_sessions table: {e}")

        # Create practice_bookings table
        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS practice_bookings (
                    id UUID PRIMARY KEY,
                    session_id UUID NOT NULL REFERENCES practice_sessions(id),
                    student_id UUID NOT NULL REFERENCES users(id),
                    booking_date TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() at time zone 'utc'),
                    status VARCHAR DEFAULT 'CONFIRMED'
                )
            """))
            print("Created practice_bookings table.")
        except Exception as e:
            print(f"Error creating practice_bookings table: {e}")

        conn.commit()
        print("Migration completed successfully.")

if __name__ == "__main__":
    migrate_practices()
