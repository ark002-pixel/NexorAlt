from database import SessionLocal, engine
import models

def fix_descriptions():
    db = SessionLocal()
    try:
        modules = db.query(models.Module).all()
        print(f"Checking {len(modules)} modules...")
        
        advanced_topics = {
            "Marco Legal (Res. 4272/2021)": "Análisis de la resolución, obligaciones empleador/trabajador, roles y responsabilidades.",
            "Identificación de Peligros": "Peligros y riesgos asociados al trabajo en alturas. Medidas de prevención y protección.",
            "Permisos de Trabajo": "Diligenciamiento del permiso, listas de chequeo y análisis de riesgo (ARO/ATS).",
            "Equipos de Protección Personal (EPP)": "Selección, uso, inspección y mantenimiento de arneses, cascos y eslingas.",
            "Sistemas de Ingeniería": "Líneas de vida, puntos de anclaje, barandas y redes de seguridad.",
            "Procedimientos de Rescate": "Plan de emergencias, autorescate y rescate asistido básico.",
            "Primeros Auxilios Básicos": "Atención inicial a trauma por suspensión y lesiones comunes."
        }

        basic_topics = {
            "Introducción a la Normativa": "Aspectos generales de la Resolución 4272 de 2021.",
            "Responsabilidad Civil y Penal": " implicaciones legales de los accidentes de trabajo.",
            "Gestión de Riesgos": "Conceptos básicos de identificación y control de riesgos."
        }
        
        # Merge dicts
        all_topics = {**advanced_topics, **basic_topics}
        
        updated_count = 0
        for m in modules:
            if m.title in all_topics:
                if not m.description or m.description.strip() == "":
                    m.description = all_topics[m.title]
                    updated_count += 1
                    print(f"Updated: {m.title}")
                    
        db.commit()
        print(f"Successfully updated {updated_count} modules.")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_descriptions()
