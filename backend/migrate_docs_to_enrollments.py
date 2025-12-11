
from sqlalchemy import text, desc
from database import SessionLocal, engine
from models import User, Document, Enrollment

def migrate_docs():
    # 1. Add Column if not exists (PostgreSQL specific manual DDL)
    with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as connection:
        try:
            print("Adding enrollment_id column to documents table...")
            connection.execute(text("ALTER TABLE documents ADD COLUMN IF NOT EXISTS enrollment_id UUID REFERENCES enrollments(id)"))
            print("Column added successfully.")
        except Exception as e:
            print(f"Schema update info: {e}")

    # 2. Logic Migration
    db = SessionLocal()
    try:
        # Get all documents without enrollment_id
        orphan_docs = db.query(Document).filter(Document.enrollment_id == None).all()
        print(f"Found {len(orphan_docs)} documents without enrollment.")

        for doc in orphan_docs:
            # Find the MOST RECENT enrollment for this user
            latest_enrollment = db.query(Enrollment)\
                .filter(Enrollment.user_id == doc.user_id)\
                .order_by(desc(Enrollment.created_at))\
                .first()
            
            if latest_enrollment:
                print(f"Linking Doc {doc.id} (User {doc.user_id}) -> Enrollment {latest_enrollment.id} (Course {latest_enrollment.course_id})")
                doc.enrollment_id = latest_enrollment.id
            else:
                print(f"WARNING: Doc {doc.id} (User {doc.user_id}) has NO enrollments. Leaving orphan.")
        
        db.commit()
        print("Data migration completed.")

    except Exception as e:
        print(f"Error migrating data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate_docs()
