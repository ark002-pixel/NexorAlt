from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
import models, schemas, auth, database
from datetime import timedelta

router = APIRouter(
    prefix="/auth",
    tags=["authentication"]
)

@router.post("/register", response_model=schemas.UserResponse)
def register_user(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    # Check if user exists
    db_user = db.query(models.User).filter(models.User.document_id == user.document_id).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Document ID already registered")
    
    db_email = db.query(models.User).filter(models.User.email == user.email).first()
    if db_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(
        document_id=user.document_id,
        email=user.email,
        full_name=user.full_name,
        hashed_password=hashed_password,
        role=user.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    # We use username field from OAuth2 form as document_id
    user = db.query(models.User).filter(models.User.document_id == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect document ID or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.document_id, "role": user.role.value},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "role": user.role.value}

@router.get("/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@router.get("/users", response_model=list[schemas.UserResponse])
def get_all_users(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    return db.query(models.User).all()

@router.get("/apprentices", response_model=list[schemas.UserResponse])
def get_apprentices(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    return db.query(models.User).filter(models.User.role == models.UserRole.STUDENT).all()

@router.get("/system-users", response_model=list[schemas.UserResponse])
def get_system_users(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    return db.query(models.User).filter(models.User.role != models.UserRole.STUDENT).all()

@router.get("/trainers", response_model=list[schemas.UserResponse])
def get_trainers(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    return db.query(models.User).filter(models.User.role == models.UserRole.TRAINER).all()

@router.put("/users/{user_id}", response_model=schemas.UserResponse)
def update_user(user_id: str, user_update: schemas.UserUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db_user.full_name = user_update.full_name
    db_user.email = user_update.email
    db_user.role = user_update.role
    db_user.document_id = user_update.document_id
    
    # Update Compliance Fields
    db_user.phone = user_update.phone
    db_user.address = user_update.address
    db_user.city = user_update.city
    db_user.birth_date = user_update.birth_date
    db_user.rh_blood_type = user_update.rh_blood_type
    db_user.gender = user_update.gender
    db_user.eps = user_update.eps
    db_user.arl = user_update.arl
    db_user.emergency_contact_name = user_update.emergency_contact_name
    db_user.emergency_contact_phone = user_update.emergency_contact_phone
    db_user.license_expiration = user_update.license_expiration

    # Update Password if provided
    if user_update.password and user_update.password.strip():
        db_user.hashed_password = auth.get_password_hash(user_update.password)
    
    db.commit()
    db.refresh(db_user)
    return db_user

@router.delete("/users/{user_id}")
def delete_user(user_id: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    try:
        # Manually delete related records to handle constraints
        # 1. Enrollments
        db.query(models.Enrollment).filter(models.Enrollment.user_id == user_id).delete()
        
        # 2. Documents
        db.query(models.Document).filter(models.Document.user_id == user_id).delete()
        
        # 3. Practice Bookings (as student)
        db.query(models.PracticeBooking).filter(models.PracticeBooking.student_id == user_id).delete()

        # 4. Certifications
        db.query(models.Certification).filter(models.Certification.user_id == user_id).delete()

        # 5. Emergency Alerts
        db.query(models.EmergencyAlert).filter(models.EmergencyAlert.user_id == user_id).delete()

        # 6. Surveys
        db.query(models.Survey).filter(models.Survey.user_id == user_id).delete()

        # 7. PQRSF
        db.query(models.PQRSF).filter(models.PQRSF.user_id == user_id).delete()

        # 8. Work Permits
        db.query(models.WorkPermit).filter(models.WorkPermit.user_id == user_id).delete()

        # 9. Audit Logs (where user is actor)
        db.query(models.AuditLog).filter(models.AuditLog.user_id == user_id).delete()

        # 10. Quiz Attempts
        db.query(models.QuizAttempt).filter(models.QuizAttempt.user_id == user_id).delete()

        # 11. Module Progress
        db.query(models.ModuleProgress).filter(models.ModuleProgress.user_id == user_id).delete()

        # 12. Payments
        db.query(models.Payment).filter(models.Payment.user_id == user_id).delete()

        # 13. Inspections (if user was inspector)
        db.query(models.Inspection).filter(models.Inspection.inspector_id == user_id).delete()

        # 14. Unassign from Courses (if user is trainer)
        db.query(models.Course).filter(models.Course.trainer_id == user_id).update({models.Course.trainer_id: None}, synchronize_session=False)

        # 15. Unassign from Practice Sessions (if user is trainer)
        db.query(models.PracticeSession).filter(models.PracticeSession.trainer_id == user_id).update({models.PracticeSession.trainer_id: None}, synchronize_session=False)

        # Finally delete the user
        db.delete(db_user)
        db.commit()
        return {"message": "User deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        # Log the specific error for debugging
        print(f"Error deleting user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting user: Detail: {str(e)}")
