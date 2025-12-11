from database import SessionLocal
import models
import uuid

def seed_modules():
    db = SessionLocal()
    try:
        courses = db.query(models.Course).all()
        print(f"Found {len(courses)} courses.")

        # Standard Curriculums based on Colombian Resolution 4272 of 2021
        
        # 1. Advanced / Re-training Topics
        advanced_topics = [
            ("Marco Legal (Res. 4272/2021)", "Análisis de la resolución, obligaciones empleador/trabajador, roles y responsabilidades."),
            ("Identificación de Peligros", "Peligros y riesgos asociados al trabajo en alturas. Medidas de prevención y protección."),
            ("Permisos de Trabajo", "Diligenciamiento del permiso, listas de chequeo y análisis de riesgo (ARO/ATS)."),
            ("Equipos de Protección Personal (EPP)", "Selección, uso, inspección y mantenimiento de arneses, cascos y eslingas."),
            ("Sistemas de Ingeniería", "Líneas de vida, puntos de anclaje, barandas y redes de seguridad."),
            ("Procedimientos de Rescate", "Plan de emergencias, autorescate y rescate asistido básico."),
            ("Primeros Auxilios Básicos", "Atención inicial a trauma por suspensión y lesiones comunes.")
        ]

        # 2. Basic / Admin Topics
        basic_topics = [
            ("Introducción a la Normativa", "Aspectos generales de la Resolución 4272 de 2021."),
            ("Responsabilidad Civil y Penal", " implicaciones legales de los accidentes de trabajo."),
            ("Gestión de Riesgos", "Conceptos básicos de identificación y control de riesgos.")
        ]

        count = 0
        for course in courses:
            # Check if course already has modules
            existing = db.query(models.Module).filter(models.Module.course_id == course.id).first()
            if existing:
                print(f"Course '{course.name}' already has modules. Skipping.")
                continue

            print(f"Seeding modules for course: {course.name}")
            
            # Determine curriculum based on name
            topics = []
            name_lower = course.name.lower()
            
            if "avanzado" in name_lower or "entrenamiento" in name_lower or "coordinador" in name_lower:
                topics = advanced_topics
            elif "administrativo" in name_lower or "basico" in name_lower or "básico" in name_lower:
                topics = basic_topics
            else:
                # Default generic set
                topics = advanced_topics[:4] # First 4 of advanced

            for idx, (title, desc) in enumerate(topics):
                mod = models.Module(
                    id=uuid.uuid4(),
                    course_id=course.id,
                    title=title,
                    description=desc,
                    order_index=idx + 1
                )
                db.add(mod)
                count += 1
        
        db.commit()
        print(f"Successfully added {count} modules to database.")

    except Exception as e:
        print(f"Error seeding modules: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_modules()
