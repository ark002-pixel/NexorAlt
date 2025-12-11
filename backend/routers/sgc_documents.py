from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import shutil
import os
import uuid
from datetime import datetime
import models, database, auth

router = APIRouter(
    prefix="/sgc",
    tags=["sgc"]
)

UPLOAD_DIR = "uploads/sgc"
os.makedirs(UPLOAD_DIR, exist_ok=True)

import schemas

@router.post("/upload", response_model=schemas.SGCDocumentResponse)
async def upload_sgc_document(
    title: str = Form(...),
    code: str = Form(...),
    version: str = Form(...),
    type: models.SGCDocumentType = Form(...),
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Save file
    file_extension = os.path.splitext(file.filename)[1]
    file_name = f"{code}_{version}_{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, file_name)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Create DB record
    new_doc = models.SGCDocument(
        title=title,
        code=code,
        version=version,
        type=type,
        url=file_path,
        is_active=True
    )
    
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    
    # Log Action
    from utils.audit import log_action
    log_action(
        db, 
        user_id=current_user.id, 
        action=models.AuditAction.CREATE, 
        resource_type=models.AuditResourceType.SYSTEM, 
        resource_id=str(new_doc.id), 
        details={"title": title, "code": code, "version": version}
    )

    return new_doc

@router.get("/documents", response_model=List[schemas.SGCDocumentResponse])
def get_sgc_documents(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return db.query(models.SGCDocument).filter(models.SGCDocument.is_active == True).all()

@router.delete("/documents/{doc_id}")
def delete_sgc_document(
    doc_id: uuid.UUID,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")

    doc = db.query(models.SGCDocument).filter(models.SGCDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    doc.is_active = False # Soft delete
    db.commit()
    
    # Log Action
    from utils.audit import log_action
    log_action(
        db, 
        user_id=current_user.id, 
        action=models.AuditAction.DELETE, 
        resource_type=models.AuditResourceType.SYSTEM, 
        resource_id=str(doc.id), 
        details={"title": doc.title, "code": doc.code}
    )

    return {"message": "Document deleted"}
