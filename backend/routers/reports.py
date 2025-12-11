from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
import models, database, auth
import csv
import io
from datetime import datetime

router = APIRouter(
    prefix="/reports",
    tags=["reports"]
)

@router.get("/mintrabajo")
def generate_mintrabajo_report(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Verify Admin role
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Query certifications joined with User and Course
    results = db.query(
        models.User.document_id,
        models.User.full_name,
        models.Course.name,
        models.Certification.issue_date,
        models.Certification.expiration_date,
        models.Certification.certificate_code
    ).join(models.Certification, models.User.id == models.Certification.user_id)\
     .join(models.Course, models.Certification.course_id == models.Course.id)\
     .all()

    # Create CSV in memory
    stream = io.StringIO()
    csv_writer = csv.writer(stream)
    
    # Header
    csv_writer.writerow(["Documento", "Nombre Completo", "Curso", "Fecha Certificación", "Fecha Vencimiento", "Código Certificado"])
    
    # Rows
    for row in results:
        csv_writer.writerow([
            row.document_id,
            row.full_name,
            row.name,
            row.issue_date.strftime("%Y-%m-%d"),
            row.expiration_date.strftime("%Y-%m-%d"),
            row.certificate_code
        ])
    
    response = StreamingResponse(iter([stream.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=reporte_mintrabajo.csv"
    return response

@router.get("/arl")
def generate_arl_report(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Verify Admin role
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Aggregate Emergency Alerts by Type and Status
    stats = db.query(
        models.EmergencyAlert.type,
        models.EmergencyAlert.status,
        func.count(models.EmergencyAlert.id)
    ).group_by(models.EmergencyAlert.type, models.EmergencyAlert.status).all()

    report_data = {
        "generated_at": datetime.utcnow().isoformat(),
        "stats": [
            {"type": s[0], "status": s[1], "count": s[2]} for s in stats
        ],
        "summary": "Reporte de accidentalidad e incidentes basado en alertas del sistema."
    }

    return report_data
