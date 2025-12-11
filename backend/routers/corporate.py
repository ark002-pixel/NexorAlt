from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
import pandas as pd
import io
import models, schemas, database, auth

router = APIRouter(
    prefix="/corporate",
    tags=["corporate"]
)

@router.post("/companies", response_model=schemas.CompanyResponse)
def create_company(company: schemas.CompanyCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != models.UserRole.ADMIN:
         raise HTTPException(status_code=403, detail="Not authorized")
    
    new_company = models.Company(**company.dict())
    db.add(new_company)
    db.commit()
    db.refresh(new_company)
    db.refresh(new_company)
    return new_company

@router.post("/companies/{company_id}/users/{user_id}")
def link_user_to_company(
    company_id: UUID,
    user_id: UUID,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    company = db.query(models.Company).filter(models.Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    user.company_id = company_id
    db.commit()
    return {"message": "User linked to company"}

@router.get("/sgc", response_model=List[schemas.SGCDocumentResponse])
def get_sgc_documents(db: Session = Depends(database.get_db)):
    return db.query(models.SGCDocument).filter(models.SGCDocument.is_active == True).all()

@router.post("/sgc", response_model=schemas.SGCDocumentResponse)
def create_sgc_document(doc: schemas.SGCDocumentCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != models.UserRole.ADMIN:
         raise HTTPException(status_code=403, detail="Not authorized")
    
    new_doc = models.SGCDocument(**doc.dict())
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    return new_doc
    return new_doc

@router.post("/employees/upload")
async def upload_employees(
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role != models.UserRole.COMPANY:
        raise HTTPException(status_code=403, detail="Only companies can upload employees")
    
    if not current_user.company_id:
        raise HTTPException(status_code=400, detail="User is not associated with any company")

    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload an Excel file.")

    try:
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))
        
        # Expected columns: Documento, Nombre Completo, Email, Cargo (Optional)
        required_columns = ['Documento', 'Nombre Completo', 'Email']
        if not all(col in df.columns for col in required_columns):
             raise HTTPException(status_code=400, detail=f"Missing columns. Required: {required_columns}")

        created_count = 0
        errors = []

        for index, row in df.iterrows():
            try:
                document_id = str(row['Documento'])
                full_name = row['Nombre Completo']
                email = row['Email']
                
                # Check if user exists
                existing_user = db.query(models.User).filter(
                    (models.User.document_id == document_id) | (models.User.email == email)
                ).first()

                if existing_user:
                    errors.append(f"Row {index+2}: User {document_id} or {email} already exists")
                    continue

                # Create user
                hashed_password = auth.get_password_hash(document_id) # Default password is document_id
                new_user = models.User(
                    document_id=document_id,
                    email=email,
                    full_name=full_name,
                    hashed_password=hashed_password,
                    role=models.UserRole.STUDENT, # Default role
                    company_id=current_user.company_id
                )
                db.add(new_user)
                created_count += 1
            except Exception as e:
                errors.append(f"Row {index+2}: {str(e)}")
        
        db.commit()
        return {
            "message": "Upload processed",
            "created_count": created_count,
            "errors": errors
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@router.get("/matrix")
def get_expiration_matrix(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != models.UserRole.COMPANY:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if not current_user.company_id:
        raise HTTPException(status_code=400, detail="User is not associated with any company")

    # Get all employees for the company
    employees = db.query(models.User).filter(models.User.company_id == current_user.company_id).all()
    
    matrix_data = []
    today = pd.Timestamp.now()

    for emp in employees:
        # Get certifications for each employee
        certs = db.query(models.Certification).filter(models.Certification.user_id == emp.id).all()
        
        for cert in certs:
            # Determine status
            expiration = pd.to_datetime(cert.expiration_date)
            days_until_expiry = (expiration - today).days
            
            status_code = "ACTIVE"
            if days_until_expiry < 0:
                status_code = "EXPIRED"
            elif days_until_expiry <= 30:
                status_code = "EXPIRING_SOON"
            
            # Get course name
            course = db.query(models.Course).filter(models.Course.id == cert.course_id).first()
            course_name = course.name if course else "Unknown Course"

            matrix_data.append({
                "employee_name": emp.full_name,
                "document_id": emp.document_id,
                "course_name": course_name,
                "issue_date": cert.issue_date,
                "expiration_date": cert.expiration_date,
                "status": status_code,
                "days_remaining": days_until_expiry
            })
            
    return matrix_data
