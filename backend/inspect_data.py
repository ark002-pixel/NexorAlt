
from database import SessionLocal
from models import User, Document

def inspect_docs():
    db = SessionLocal()
    users = db.query(User).filter(User.full_name.in_(["APRENDIZ DE PRUEBA", "MARIO CANINO"])).all()
    
    for u in users:
        print(f"User: {u.full_name} ({u.id})")
        for d in u.documents:
            print(f"  - Doc: {d.type} | Status: {d.status} | URL: {d.file_url} | Created: {d.created_at}")
            
    db.close()

if __name__ == "__main__":
    inspect_docs()
