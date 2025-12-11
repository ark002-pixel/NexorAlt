from database import SessionLocal
import models
import seed_modules

def cleanup_reseed():
    db = SessionLocal()
    try:
        # Pre-cleanup dependencies
        print("Deleting Quiz Attempts...")
        db.query(models.QuizAttempt).delete()
        print("Deleting Module Progress...")
        db.query(models.ModuleProgress).delete()
        print("Deleting Questions...")
        db.query(models.Question).delete()
        
        # 1. Delete ALL modules
        count = db.query(models.Module).delete()
        db.commit()
        print(f"Deleted {count} old modules.")
        
        # 2. Run seed
        print("Running seed_modules...")
        seed_modules.seed_modules()
        print("Seed complete.")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    cleanup_reseed()
