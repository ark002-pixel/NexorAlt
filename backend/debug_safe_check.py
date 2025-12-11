from sqlalchemy import text
from database import engine

def check_db():
    with engine.connect() as conn:
        print("Checking 'courses' table columns...")
        try:
            # Postgres specific info schema or just select * limit 0
            result = conn.execute(text("SELECT * FROM courses LIMIT 0"))
            print("Columns found:", result.keys())
        except Exception as e:
            print("Error inspecting columns:", e)

        print("-" * 20)
        print("Listing recent courses:")
        try:
            rows = conn.execute(text("SELECT name, start_date, duration_days FROM courses ORDER BY start_date DESC LIMIT 5")).fetchall()
            for r in rows:
                print(r)
        except Exception as e:
            print("Error listing courses:", e)
            
if __name__ == "__main__":
    check_db()
