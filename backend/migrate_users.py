from database import engine
from sqlalchemy import text

def migrate_users():
    with engine.connect() as conn:
        print("Starting migration...")
        
        # List of new columns to add if they don't exist
        columns = [
            ("phone", "VARCHAR"),
            ("address", "VARCHAR"),
            ("city", "VARCHAR"),
            ("birth_date", "TIMESTAMP"),
            ("rh_blood_type", "VARCHAR"),
            ("gender", "VARCHAR"),
            ("eps", "VARCHAR"),
            ("arl", "VARCHAR"),
            ("emergency_contact_name", "VARCHAR"),
            ("emergency_contact_phone", "VARCHAR")
        ]
        
        for col_name, col_type in columns:
            try:
                # Try simple ALTER TABLE (PostgreSQL/SQLite compatible syntax usually)
                sql = text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type};")
                conn.execute(sql)
                print(f"Added column: {col_name}")
            except Exception as e:
                print(f"Column {col_name} might already exist or error: {e}")
                
        conn.commit()
        print("Migration complete.")

if __name__ == "__main__":
    migrate_users()
