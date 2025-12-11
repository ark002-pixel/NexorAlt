from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import shutil
import os
import uuid
import json
import models, schemas, database, auth

router = APIRouter(
    prefix="/documents",
    tags=["documents"]
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", response_model=schemas.DocumentResponse)
async def upload_document(
    type: str = Form(...),
    expiration_date: Optional[datetime] = Form(None),
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    # Validate file type
    if file.content_type not in ["application/pdf", "image/jpeg", "image/png"]:
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF, JPEG, PNG allowed.")

    # Save file
    file_extension = os.path.splitext(file.filename)[1]
    file_name = f"{current_user.id}_{type}_{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, file_name)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Create DB record
    new_doc = models.Document(
        user_id=current_user.id,
        type=type,
        file_url=file_path,
        expiration_date=expiration_date,
        status=models.DocumentStatus.PENDING
    )
    
    # Check if document of this type already exists, if so, archive/delete old one? 
    # For now, we just add new one. Ideally we should check for existing pending/approved docs.
    
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    return new_doc

@router.get("/my-status", response_model=List[schemas.DocumentResponse])
def get_my_documents(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    return db.query(models.Document).filter(models.Document.user_id == current_user.id).all()

@router.get("/pending", response_model=List[schemas.DocumentResponse])
def get_pending_documents(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return db.query(models.Document).filter(models.Document.status == models.DocumentStatus.PENDING).all()

@router.patch("/{document_id}/review", response_model=schemas.DocumentResponse)
def review_document(
    document_id: uuid.UUID,
    update_data: schemas.DocumentUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    document = db.query(models.Document).filter(models.Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    document.status = update_data.status
    if update_data.rejection_reason:
        document.rejection_reason = update_data.rejection_reason
        
    db.commit()
    db.refresh(document)
    
    # Check if we should auto-complete the enrollment
    if document.status == models.DocumentStatus.APPROVED and document.enrollment_id:
        enrollment = db.query(models.Enrollment).filter(models.Enrollment.id == document.enrollment_id).first()
        if enrollment:
            # Get course requirements
            course = enrollment.course
            required_types = []
            if course.required_documents:
                try:
                    required_types = json.loads(course.required_documents)
                except:
                    pass
            
            # Check all required docs for this enrollment
            all_approved = True
            enrollment_docs = db.query(models.Document).filter(models.Document.enrollment_id == enrollment.id).all()
            
            for r_type in required_types:
                # Find doc of this type
                d = next((x for x in enrollment_docs if x.type == r_type), None)
                if not d or d.status != models.DocumentStatus.APPROVED:
                    all_approved = False
                    break
            
            if all_approved and required_types: # Ensure there were requirements
                enrollment.status = models.EnrollmentStatus.COMPLETED
                db.commit()

    return document

@router.get("/matrix", response_model=List[schemas.DocumentMatrixItem])
def get_compliance_matrix(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get all enrollments for students
    enrollments = db.query(models.Enrollment)\
        .join(models.User)\
        .filter(models.User.role == models.UserRole.STUDENT)\
        .order_by(models.Enrollment.created_at.desc())\
        .all()
    
    matrix = []
    
    for enrollment in enrollments:
        student = enrollment.user
        course = enrollment.course
        
        required_types = ["ID_CARD", "SOCIAL_SECURITY", "MEDICAL_CONCEPT"] # Default
        course_name = course.name
        
        if course.required_documents:
            try:
                required_types = json.loads(course.required_documents)
            except:
                pass 
                        
        # Get documents LINKED to this enrollment
        docs = db.query(models.Document).filter(
            models.Document.user_id == student.id,
            models.Document.enrollment_id == enrollment.id
        ).all()
        
        doc_map = {}
        
        for dtype in required_types:
            found = next((d for d in docs if d.type == dtype), None)
            doc_map[dtype] = schemas.DocumentResponse.from_orm(found) if found else None
            
        matrix.append(schemas.DocumentMatrixItem(
            user_id=student.id,
            enrollment_id=enrollment.id,
            enrollment_status=enrollment.status.value if enrollment.status else "ENROLLED",
            enrollment_date=enrollment.created_at,
            full_name=student.full_name,
            document_id=student.document_id,
            course_name=course_name,
            required_types=required_types,
            documents=doc_map
        ))
        
    return matrix


@router.post("/upload-on-behalf", response_model=schemas.DocumentResponse)
async def upload_document_on_behalf(
    user_id: uuid.UUID = Form(...),
    enrollment_id: Optional[uuid.UUID] = Form(None),
    type: str = Form(...),
    expiration_date: Optional[datetime] = Form(None),
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    # Verify user exists
    target_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Validate file type
    if file.content_type not in ["application/pdf", "image/jpeg", "image/png"]:
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF, JPEG, PNG allowed.")

    # Save file
    file_extension = os.path.splitext(file.filename)[1]
    safe_type = "".join([c for c in type if c.isalnum() or c in ('-', '_')])
    file_name = f"{target_user.id}_{safe_type}_onbehalf_{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, file_name)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Create DB record
    new_doc = models.Document(
        user_id=target_user.id,
        enrollment_id=enrollment_id, # Linked to specific enrollment
        type=type,
        file_url=file_path,
        expiration_date=expiration_date,
        status=models.DocumentStatus.PENDING # Set to PENDING to allow manual verification workflow
    )
    
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    return new_doc

@router.get("/user/{user_id}", response_model=List[schemas.DocumentResponse])
def get_user_documents(
    user_id: uuid.UUID,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    return db.query(models.Document).filter(models.Document.user_id == user_id).all()
