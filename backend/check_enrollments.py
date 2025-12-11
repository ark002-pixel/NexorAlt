from database import SessionLocal
from models import Enrollment
db = SessionLocal()
results = [(e.id, e.status, e.course_id, e.user_id) for e in db.query(Enrollment).all()]
print(f"Total Enrollments: {len(results)}")
for r in results:
    print(f"ID: {r[0]}, Status: {r[1]}, Course: {r[2]}, User: {r[3]}")
