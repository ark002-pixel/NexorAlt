from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend import models
import json

def enable_quizzes():
    db = SessionLocal()
    try:
        modules = db.query(models.Module).all()
        print(f"Found {len(modules)} modules. Updating...")
        
        for module in modules:
            # Enable quiz
            module.has_quiz = True
            module.passing_score = 60
            
            # Check if questions exist
            question_count = db.query(models.Question).filter(models.Question.module_id == module.id).count()
            
            if question_count == 0:
                print(f"Adding questions to {module.title}...")
                questions = [
                    models.Question(
                        module_id=module.id,
                        text=f"¿Pregunta 1 del {module.title}?",
                        options=json.dumps(["Opción A", "Opción B (Correcta)", "Opción C", "Opción D"]),
                        correct_option_index=1
                    ),
                    models.Question(
                        module_id=module.id,
                        text=f"¿Pregunta 2 del {module.title}?",
                        options=json.dumps(["Opción A (Correcta)", "Opción B", "Opción C", "Opción D"]),
                        correct_option_index=0
                    ),
                    models.Question(
                        module_id=module.id,
                        text=f"¿Pregunta 3 del {module.title}?",
                        options=json.dumps(["Opción A", "Opción B", "Opción C (Correcta)", "Opción D"]),
                        correct_option_index=2
                    )
                ]
                db.add_all(questions)
        
        db.commit()
        print("Successfully enabled quizzes and added questions.")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    enable_quizzes()
