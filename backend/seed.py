from sqlalchemy.orm import Session
from backend.database import SessionLocal, engine, Base
from backend import models, auth
import uuid

def seed_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if admin exists by email OR document_id to avoid duplicates
        admin = db.query(models.User).filter(
            (models.User.email == "admin@nexor.com") | (models.User.document_id == "123456789")
        ).first()

        if not admin:
            print("Creating Admin User...")
            admin = models.User(
                id=uuid.uuid4(),
                document_id="123456789",
                email="admin@nexor.com",
                full_name="Administrador Sistema",
                hashed_password=auth.get_password_hash("admin123"),
                role=models.UserRole.ADMIN
            )
            db.add(admin)
        else:
            print(f"Updating Admin User (ID: {admin.id})...")
            admin.document_id = "123456789"
            admin.email = "admin@nexor.com"
            admin.hashed_password = auth.get_password_hash("admin123")
            admin.role = models.UserRole.ADMIN
            db.add(admin)
        
        # Check if courses exist
        if db.query(models.Course).count() == 0:
            print("Creating Initial Courses...")
            courses = [
                models.Course(
                    name="Curso Básico Operativo",
                    description="Formación para trabajadores que realicen trabajo en alturas con riesgo de caída.",
                    required_hours=8,
                    type=models.CourseType.THEORY,
                    price=150000
                ),
                models.Course(
                    name="Nivel Avanzado",
                    description="Para trabajadores que realicen desplazamientos horizontales y verticales por las estructuras.",
                    required_hours=40,
                    type=models.CourseType.BLENDED,
                    price=450000
                ),
                models.Course(
                    name="Coordinador de Alturas",
                    description="Para personal encargado de controlar los riesgos en los lugares de trabajo.",
                    required_hours=80,
                    type=models.CourseType.THEORY,
                    price=600000
                ),
                models.Course(
                    name="Reentrenamiento Anual",
                    description="Actualización obligatoria anual para mantener la certificación vigente.",
                    required_hours=20,
                    type=models.CourseType.PRACTICE,
                    price=200000
                )
            ]
            db.add_all(courses)
            db.commit()
        
        # Ensure modules exist for all courses
        courses = db.query(models.Course).all()
        for course in courses:
            if db.query(models.Module).filter(models.Module.course_id == course.id).count() == 0:
                print(f"Adding Modules to {course.name}...")
                modules = []
                for i in range(1, 6): # 5 modules per course
                    module = models.Module(
                        course_id=course.id,
                        title=f"Módulo {i}: Fundamentos {course.name}",
                        content_url="https://www.youtube.com/embed/dQw4w9WgXcQ", # Rick Roll placeholder
                        order_index=i,
                        min_duration_seconds=10 if i == 1 else 60, # First module 10s for testing
                        has_quiz=True, # Enable quiz for all modules for testing
                        passing_score=60
                    )
                    modules.append(module)
                db.add_all(modules)
                db.commit() # Commit to get IDs
                
                # Add questions to modules
                import json
                print(f"Adding Questions to Modules of {course.name}...")
                for module in modules:
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

        # Enroll Admin in the first course
        first_course = db.query(models.Course).first()
        if first_course:
            existing_enrollment = db.query(models.Enrollment).filter(
                models.Enrollment.user_id == admin.id,
                models.Enrollment.course_id == first_course.id
            ).first()
            
            if not existing_enrollment:
                print(f"Enrolling Admin in {first_course.name}...")
                enrollment = models.Enrollment(
                    user_id=admin.id,
                    course_id=first_course.id,
                    status=models.EnrollmentStatus.ENROLLED
                )
                db.add(enrollment)
                db.commit()

        db.commit()
        print("Database seeded successfully!")

    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
