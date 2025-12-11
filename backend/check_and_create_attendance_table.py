from database import engine
from sqlalchemy import text

def run():
    with engine.connect() as conn:
        # Create table manually using the existing Enum type 'attendancestatus'
        sql = """
        CREATE TABLE IF NOT EXISTS attendance_records (
            id UUID PRIMARY KEY,
            enrollment_id UUID NOT NULL,
            trainer_id UUID NOT NULL,
            date TIMESTAMP WITHOUT TIME ZONE NOT NULL,
            status attendancestatus DEFAULT 'PRESENT',
            signature_url VARCHAR,
            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() at time zone 'utc'),
            FOREIGN KEY(enrollment_id) REFERENCES enrollments(id),
            FOREIGN KEY(trainer_id) REFERENCES users(id)
        );
        """
        try:
            conn.execute(text(sql))
            conn.commit()
            print("Table attendance_records created (or already exists).")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    run()
