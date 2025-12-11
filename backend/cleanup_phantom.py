
from database import SessionLocal
from models import User, Document, DocumentType

def cleanup_phantom():
    db = SessionLocal()
    # Find Aprendiz de Prueba
    u = db.query(User).filter(User.full_name == "APRENDIZ DE PRUEBA").first()
    if u:
        print(f"Cleaning docs for {u.full_name}")
        docs = db.query(Document).filter(
            Document.user_id == u.id,
            Document.type == DocumentType.HEIGHTS_ADVANCED_CERT
        ).all()
        
        for d in docs:
            print(f"Deleting doc {d.id} created at {d.created_at}")
            db.delete(d)
        
        db.commit()
    else:
        print("User not found")
    
    db.close()

if __name__ == "__main__":
    cleanup_phantom()
