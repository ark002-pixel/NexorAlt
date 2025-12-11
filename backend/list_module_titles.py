from database import SessionLocal
import models

def list_titles():
    db = SessionLocal()
    titles = db.query(models.Module.title).distinct().all()
    print("Existing Module Titles:")
    for t in titles:
        print(f" - {t[0]}")
    db.close()

if __name__ == "__main__":
    list_titles()
