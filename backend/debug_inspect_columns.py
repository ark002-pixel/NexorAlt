from sqlalchemy import inspect
from database import engine

def inspect_db():
    inspector = inspect(engine)
    columns = inspector.get_columns('courses')
    print(f"Columns in 'courses' table ({len(columns)}):")
    for c in columns:
        print(f"- {c['name']} ({c['type']})")

if __name__ == "__main__":
    inspect_db()
