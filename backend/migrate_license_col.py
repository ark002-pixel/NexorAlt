from database import engine
from sqlalchemy import text

def add_license_expiration():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN license_expiration TIMESTAMP WITHOUT TIME ZONE NULL"))
            conn.commit()
            print("Successfully added license_expiration column.")
        except Exception as e:
            print(f"Error adding column (might already exist): {e}")

if __name__ == "__main__":
    add_license_expiration()
