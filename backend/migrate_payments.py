from sqlalchemy import create_engine, text

DB_URL = "postgresql://nexor_user:nexor_password@localhost:5432/nexor_db"

def migrate_payments():
    engine = create_engine(DB_URL)
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE payments ADD COLUMN invoice_url VARCHAR"))
            conn.commit()
            print("Migration successful: Added invoice_url to payments table.")
        except Exception as e:
            print(f"Migration failed (maybe column exists): {e}")

if __name__ == "__main__":
    migrate_payments()
