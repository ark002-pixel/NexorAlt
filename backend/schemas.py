from pydantic import BaseModel, EmailStr
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from models import UserRole

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    document_id: str
    role: UserRole = UserRole.STUDENT
    
    # Compliance Fields
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    birth_date: Optional[datetime] = None
    rh_blood_type: Optional[str] = None
    gender: Optional[str] = None
    eps: Optional[str] = None
    arl: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    license_expiration: Optional[datetime] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(UserBase):
    password: Optional[str] = None

class UserLogin(BaseModel):
    document_id: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str

class TokenData(BaseModel):
    document_id: Optional[str] = None

class UserResponse(UserBase):
    id: UUID
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class DocumentBase(BaseModel):
    type: str
    expiration_date: Optional[datetime] = None

class DocumentCreate(DocumentBase):
    pass

class DocumentUpdate(BaseModel):
    status: str
    rejection_reason: Optional[str] = None

class DocumentResponse(DocumentBase):
    id: UUID
    user_id: UUID
    file_url: str
    status: str
    rejection_reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ModuleBase(BaseModel):
    title: str
    description: Optional[str] = None
    content_url: Optional[str] = None
    min_duration_seconds: int = 0
    order_index: int = 0

class ModuleCreate(ModuleBase):
    course_id: UUID

class ModuleUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    order_index: Optional[int] = None

class QuestionBase(BaseModel):
    text: str
    options: str # JSON string
    correct_option_index: int

class QuestionCreate(QuestionBase):
    pass

class QuestionResponse(BaseModel):
    id: UUID
    text: str
    options: str # JSON string
    # correct_option_index is NOT returned to student

    class Config:
        from_attributes = True

class QuizSubmission(BaseModel):
    answers: List[int] # List of selected indices

class QuizResult(BaseModel):
    score: int
    passed: bool
    correct_answers: int
    total_questions: int

class ModuleResponse(ModuleBase):
    id: UUID
    course_id: UUID
    has_quiz: bool
    passing_score: int

    class Config:
        from_attributes = True

class ModuleProgressCreate(BaseModel):
    status: str
    seconds_spent: int

class ModuleProgressResponse(BaseModel):
    id: UUID
    user_id: UUID
    module_id: UUID
    status: str
    seconds_spent: int
    last_updated: datetime

    class Config:
        from_attributes = True

class CourseBase(BaseModel):
    name: str
    description: Optional[str] = None
    required_hours: int
    type: str
    price: int
    required_documents: Optional[str] = None
    start_date: Optional[datetime] = None
    duration_days: Optional[int] = 1
    location: Optional[str] = None
    capacity: int = 20
    trainer_id: Optional[UUID] = None

class CourseCreate(CourseBase):
    pass

class CourseResponse(CourseBase):
    id: UUID
    code: Optional[str] = None
    created_at: datetime
    modules: List[ModuleResponse] = []
    enrolled_count: int = 0
    trainer_name: Optional[str] = None # Helper field

    class Config:
        from_attributes = True

class EnrollmentResponse(BaseModel):
    id: UUID
    user_id: UUID
    course_id: UUID
    status: str
    progress_percent: int
    created_at: datetime

    class Config:
        from_attributes = True

class EnrollmentCreateAdmin(BaseModel):
    user_id: UUID

class PaymentCreate(BaseModel):
    course_id: UUID
    amount: int
    provider: str = "WOMPI"

class PracticeSessionBase(BaseModel):
    course_id: UUID
    date: datetime
    location: str
    capacity: int = 10

class PracticeSessionCreate(PracticeSessionBase):
    pass

class PracticeSessionResponse(PracticeSessionBase):
    id: UUID
    trainer_id: UUID
    status: str
    created_at: datetime
    bookings_count: int = 0

    class Config:
        from_attributes = True

class BookingCreate(BaseModel):
    session_id: UUID

class BookingResponse(BaseModel):
    id: UUID
    session_id: UUID
    student_id: UUID
    status: str
    booking_date: datetime

    class Config:
        from_attributes = True

class CertificationResponse(BaseModel):
    id: UUID
    user_id: UUID
    course_id: UUID
    issue_date: datetime
    expiration_date: datetime
    certificate_code: str
    pdf_url: Optional[str] = None

    class Config:
        from_attributes = True

class CompanyBase(BaseModel):
    name: str
    nit: str
    contact_email: str

class CompanyCreate(CompanyBase):
    pass

class CompanyResponse(CompanyBase):
    id: UUID
    subscription_status: str
    created_at: datetime

    class Config:
        from_attributes = True

class SGCDocumentBase(BaseModel):
    title: str
    code: str
    version: str = "1.0"
    type: str
    url: str

class SGCDocumentCreate(SGCDocumentBase):
    pass

class SGCDocumentResponse(SGCDocumentBase):
    id: UUID
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class EquipmentBase(BaseModel):
    name: str
    serial_number: str
    type: str
    purchase_date: Optional[datetime] = None
    status: str = "OPERATIONAL"

class EquipmentCreate(EquipmentBase):
    pass

class EquipmentResponse(EquipmentBase):
    id: UUID
    last_inspection_date: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class InspectionBase(BaseModel):
    equipment_id: UUID
    result: str
    notes: Optional[str] = None
    evidence_url: Optional[str] = None

class InspectionCreate(InspectionBase):
    pass

class InspectionResponse(InspectionBase):
    id: UUID
    inspector_id: UUID
    date: datetime

    class Config:
        from_attributes = True

class CertificationBase(BaseModel):
    course_id: UUID
    issue_date: datetime
    expiration_date: datetime
    certificate_code: str
    pdf_url: Optional[str] = None

class CertificationCreate(CertificationBase):
    user_id: UUID

class CertificationResponse(CertificationBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    course_name: Optional[str] = None
    student_name: Optional[str] = None
    student_document_id: Optional[str] = None

    class Config:
        from_attributes = True

from typing import Dict

class DocumentMatrixItem(BaseModel):
    user_id: UUID
    enrollment_id: Optional[UUID] = None
    enrollment_status: Optional[str] = None
    enrollment_date: Optional[datetime] = None
    full_name: str
    document_id: str
    course_name: Optional[str] = None
    required_types: List[str] = []
    documents: Dict[str, Optional[DocumentResponse]]

