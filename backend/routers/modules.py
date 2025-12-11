from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
from pydantic import BaseModel
from typing import List, Optional
import uuid

router = APIRouter(
    prefix="/modules",
    tags=["modules"]
)

@router.get("/course/{course_id}", response_model=List[schemas.ModuleResponse])
def get_course_modules(course_id: str, db: Session = Depends(get_db)):
    modules = db.query(models.Module).filter(models.Module.course_id == course_id).order_by(models.Module.order_index).all()
    return modules

@router.post("", response_model=schemas.ModuleResponse)
def create_module(module: schemas.ModuleCreate, db: Session = Depends(get_db)):
    # Check if course exists
    course = db.query(models.Course).filter(models.Course.id == module.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
        
    db_module = models.Module(
        id=uuid.uuid4(),
        course_id=module.course_id,
        title=module.title,
        description=module.description,
        order_index=module.order_index
    )
    db.add(db_module)
    db.commit()
    db.refresh(db_module)
    return db_module

@router.put("/{module_id}", response_model=schemas.ModuleResponse)
def update_module(module_id: str, module_update: schemas.ModuleUpdate, db: Session = Depends(get_db)):
    db_module = db.query(models.Module).filter(models.Module.id == module_id).first()
    if not db_module:
        raise HTTPException(status_code=404, detail="Module not found")
        
    if module_update.title is not None:
        db_module.title = module_update.title
    if module_update.description is not None:
        db_module.description = module_update.description
    if module_update.order_index is not None:
        db_module.order_index = module_update.order_index
        
    db.commit()
    db.refresh(db_module)
    return db_module

@router.delete("/{module_id}")
def delete_module(module_id: str, db: Session = Depends(get_db)):
    db_module = db.query(models.Module).filter(models.Module.id == module_id).first()
    if not db_module:
        raise HTTPException(status_code=404, detail="Module not found")
        
    db.delete(db_module)
    db.commit()
    return {"message": "Module deleted successfully"}
