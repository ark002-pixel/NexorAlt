from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from datetime import datetime, timedelta
import uuid

import models, schemas, database, auth
from utils import pdf_generator

router = APIRouter(
    prefix="/certificates",
    tags=["certificates"]
)

@router.post("/issue", response_model=schemas.CertificationResponse)
def issue_certificate(
    request: schemas.CertificationCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Only Admin or Trainer can issue manually, OR system logic (but here we expose manual for now)
    # Let's allow Admin/Trainer to issue.
    if current_user.role not in [models.UserRole.ADMIN, models.UserRole.TRAINER]:
        raise HTTPException(status_code=403, detail="Not authorized to issue certificates")
    
    # Check if certificate already exists
    existing_cert = db.query(models.Certification).filter(
        models.Certification.user_id == request.user_id,
        models.Certification.course_id == request.course_id
    ).first()
    
    if existing_cert:
        return existing_cert

    # Get User and Course
    user = db.query(models.User).filter(models.User.id == request.user_id).first()
    course = db.query(models.Course).filter(models.Course.id == request.course_id).first()
    
    if not user or not course:
        raise HTTPException(status_code=404, detail="User or Course not found")

    # Generate Code
    cert_code = f"CERT-{uuid.uuid4().hex[:8].upper()}"
    
    # Generate PDF
    pdf_url = pdf_generator.generate_certificate_pdf(user, course, cert_code)
    
    # Create Certification
    db_cert = models.Certification(
        user_id=request.user_id,
        course_id=request.course_id,
        issue_date=request.issue_date,
        expiration_date=request.expiration_date,
        certificate_code=cert_code,
        pdf_url=pdf_url
    )
    db.add(db_cert)
    db.commit()
    db.refresh(db_cert)
    
    # Attach course name for response
    response = schemas.CertificationResponse.from_orm(db_cert)
    response.course_name = course.name
    
    return response

@router.get("/my-certificates", response_model=List[schemas.CertificationResponse])
def get_my_certificates(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    certs = db.query(models.Certification).filter(models.Certification.user_id == current_user.id).all()
    
    results = []
    for cert in certs:
        course = db.query(models.Course).filter(models.Course.id == cert.course_id).first()
        cert_data = schemas.CertificationResponse.from_orm(cert)
        if course:
            cert_data.course_name = course.name
        results.append(cert_data)
        
    return results

@router.get("/validate/{code}", response_model=schemas.CertificationResponse)
def validate_certificate(
    code: str,
    db: Session = Depends(database.get_db)
):
    cert = db.query(models.Certification).filter(models.Certification.certificate_code == code).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
        
    course = db.query(models.Course).filter(models.Course.id == cert.course_id).first()
    user = db.query(models.User).filter(models.User.id == cert.user_id).first()
    
    cert_data = schemas.CertificationResponse.from_orm(cert)
    
    if course:
        cert_data.course_name = course.name
    
    if user:
        cert_data.student_name = user.full_name
        cert_data.student_document_id = user.document_id
        
    return cert_data

@router.get("/validate/by-document/{document_id}", response_model=List[schemas.CertificationResponse])
def validate_certificates_by_document(
    document_id: str,
    db: Session = Depends(database.get_db)
):
    user = db.query(models.User).filter(models.User.document_id == document_id).first()
    if not user:
        # Return empty list if user not found, or 404? 
        # Usually validation checks return "No records found" effectively represented by empty list.
        return []
        
    certs = db.query(models.Certification).filter(models.Certification.user_id == user.id).all()
    
    results = []
    for cert in certs:
        course = db.query(models.Course).filter(models.Course.id == cert.course_id).first()
        cert_data = schemas.CertificationResponse.from_orm(cert)
        
        if course:
            cert_data.course_name = course.name
        
        cert_data.student_name = user.full_name
        cert_data.student_document_id = user.document_id
        
        results.append(cert_data)
        
    return results

@router.get("/expiring-soon", response_model=List[schemas.CertificationResponse])
def get_expiring_certificates(
    days: int = 30,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    start_date = datetime.utcnow()
    end_date = start_date + timedelta(days=days)
    
    certs = db.query(models.Certification).filter(
        models.Certification.expiration_date >= start_date,
        models.Certification.expiration_date <= end_date
    ).all()
    
    results = []
    for cert in certs:
        # Optimizable with joinedload
        course = db.query(models.Course).filter(models.Course.id == cert.course_id).first()
        user = db.query(models.User).filter(models.User.id == cert.user_id).first()
        
        cert_data = schemas.CertificationResponse.from_orm(cert)
        
        if course:
            cert_data.course_name = course.name
        
        if user:
            cert_data.student_name = user.full_name
            cert_data.student_document_id = user.document_id
            
        results.append(cert_data)
        
    return results
