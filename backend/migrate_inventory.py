from backend.database import engine
from sqlalchemy import text

def migrate_inventory():
    with engine.connect() as conn:
        print("Starting migration for Inventory Management...")
        
        # Create equipment table
        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS equipment (
                    id UUID PRIMARY KEY,
                    name VARCHAR NOT NULL,
                    serial_number VARCHAR UNIQUE NOT NULL,
                    type VARCHAR NOT NULL,
                    purchase_date TIMESTAMP WITHOUT TIME ZONE,
                    last_inspection_date TIMESTAMP WITHOUT TIME ZONE,
                    status VARCHAR DEFAULT 'OPERATIONAL',
                    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() at time zone 'utc')
                )
            """))
            print("Created equipment table.")
        except Exception as e:
            print(f"Error creating equipment table: {e}")

        # Create inspections table
        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS inspections (
                    id UUID PRIMARY KEY,
                    equipment_id UUID NOT NULL REFERENCES equipment(id),
                    inspector_id UUID NOT NULL REFERENCES users(id),
                    date TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() at time zone 'utc'),
                    result VARCHAR NOT NULL,
                    notes VARCHAR,
                    evidence_url VARCHAR
                )
            """))
            print("Created inspections table.")
        except Exception as e:
            print(f"Error creating inspections table: {e}")

        conn.commit()
        print("Migration completed successfully.")

if __name__ == "__main__":
    migrate_inventory()
