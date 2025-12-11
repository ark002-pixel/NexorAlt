from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Enum, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
import enum
from database import Base

class UserRole(str, enum.Enum):
    STUDENT = "STUDENT"
    TRAINER = "TRAINER"
    ADMIN = "ADMIN"
    COMPANY = "COMPANY"

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.STUDENT)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Compliance Fields (MinTrabajo / SENA)
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    city = Column(String, nullable=True)
    birth_date = Column(DateTime, nullable=True)
    rh_blood_type = Column(String, nullable=True) # e.g. "O+"
    gender = Column(String, nullable=True) # "M", "F", "OTHER"
    eps = Column(String, nullable=True)
    arl = Column(String, nullable=True)
    emergency_contact_name = Column(String, nullable=True)
    emergency_contact_phone = Column(String, nullable=True)
    
    # Instructor Specific
    license_expiration = Column(DateTime, nullable=True)

    company = relationship("Company", back_populates="employees")
    documents = relationship("Document", back_populates="user")
    enrollments = relationship("Enrollment", back_populates="user")

class DocumentType(str, enum.Enum):
    ID_CARD = "ID_CARD"
    SOCIAL_SECURITY = "SOCIAL_SECURITY"
    MEDICAL_CONCEPT = "MEDICAL_CONCEPT"
    HEIGHTS_BASIC_CERT = "HEIGHTS_BASIC_CERT"
    HEIGHTS_ADVANCED_CERT = "HEIGHTS_ADVANCED_CERT"
    RESCUE_CERT = "RESCUE_CERT"
    # Trainer Specific
    CV = "CV"
    SST_LICENSE = "SST_LICENSE"
    TRAINER_CERT = "TRAINER_CERT"

class DocumentStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    enrollment_id = Column(UUID(as_uuid=True), ForeignKey("enrollments.id"), nullable=True) # Linked to specific enrollment
    type = Column(Enum(DocumentType), nullable=False)
    file_url = Column(String, nullable=False)
    status = Column(Enum(DocumentStatus), default=DocumentStatus.PENDING)
    expiration_date = Column(DateTime, nullable=True)
    rejection_reason = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="documents")
    enrollment = relationship("Enrollment", back_populates="documents")

class CourseType(str, enum.Enum):
    THEORY = "THEORY"
    PRACTICE = "PRACTICE"
    BLENDED = "BLENDED"

class Course(Base):
    __tablename__ = "courses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    code = Column(String, unique=True, nullable=True) # Added for Automatic Codification
    description = Column(String, nullable=True)
    required_hours = Column(Integer, nullable=False)
    type = Column(Enum(CourseType), default=CourseType.BLENDED)
    price = Column(Integer, nullable=False)
    
    # Physical/Hybrid Course Fields
    required_documents = Column(String, nullable=True) # JSON list of DocumentTypes
    start_date = Column(DateTime, nullable=True)
    duration_days = Column(Integer, default=1) # Duration in days for attendance
    location = Column(String, nullable=True)
    capacity = Column(Integer, default=20)
    trainer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True) # Assigned Trainer
    
    created_at = Column(DateTime, default=datetime.utcnow)

    modules = relationship("Module", back_populates="course")
    enrollments = relationship("Enrollment", back_populates="course")
    trainer = relationship("User", foreign_keys=[trainer_id])

    @property
    def trainer_name(self):
        return self.trainer.full_name if self.trainer else None

class Module(Base):
    __tablename__ = "modules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    content_url = Column(String, nullable=True)
    min_duration_seconds = Column(Integer, default=0)
    order_index = Column(Integer, default=0)

    course = relationship("Course", back_populates="modules")
    questions = relationship("Question", back_populates="module")
    has_quiz = Column(Boolean, default=False)
    passing_score = Column(Integer, default=80)

class Question(Base):
    __tablename__ = "questions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    module_id = Column(UUID(as_uuid=True), ForeignKey("modules.id"), nullable=False)
    text = Column(String, nullable=False)
    options = Column(String, nullable=False) # Stored as JSON string for simplicity in SQLite/Generic
    correct_option_index = Column(Integer, nullable=False)
    
    module = relationship("Module", back_populates="questions")

class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    module_id = Column(UUID(as_uuid=True), ForeignKey("modules.id"), nullable=False)
    score = Column(Integer, nullable=False)
    passed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    module = relationship("Module")

class ModuleProgress(Base):
    __tablename__ = "module_progress"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    module_id = Column(UUID(as_uuid=True), ForeignKey("modules.id"), nullable=False)
    status = Column(String, default="LOCKED") # LOCKED, IN_PROGRESS, COMPLETED
    seconds_spent = Column(Integer, default=0)
    last_updated = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    module = relationship("Module")

class EnrollmentStatus(str, enum.Enum):
    ENROLLED = "ENROLLED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"

class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id"), nullable=False)
    status = Column(Enum(EnrollmentStatus), default=EnrollmentStatus.ENROLLED)
    progress_percent = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="enrollments")
    course = relationship("Course", back_populates="enrollments")
    documents = relationship("Document", back_populates="enrollment")
    attendance_records = relationship("AttendanceRecord", back_populates="enrollment")

class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class Payment(Base):
    __tablename__ = "payments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    amount = Column(Integer, nullable=False)
    status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING)
    provider = Column(String, default="WOMPI")
    transaction_id = Column(String, nullable=True)
    invoice_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class SessionStatus(str, enum.Enum):
    SCHEDULED = "SCHEDULED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class PracticeSession(Base):
    __tablename__ = "practice_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id"), nullable=False)
    trainer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    date = Column(DateTime, nullable=False)
    location = Column(String, nullable=False)
    capacity = Column(Integer, default=10)
    status = Column(Enum(SessionStatus), default=SessionStatus.SCHEDULED)
    created_at = Column(DateTime, default=datetime.utcnow)

    course = relationship("Course")
    trainer = relationship("User")
    bookings = relationship("PracticeBooking", back_populates="session")

class BookingStatus(str, enum.Enum):
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"
    ATTENDED = "ATTENDED"

class PracticeBooking(Base):
    __tablename__ = "practice_bookings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("practice_sessions.id"), nullable=False)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    booking_date = Column(DateTime, default=datetime.utcnow)
    status = Column(Enum(BookingStatus), default=BookingStatus.CONFIRMED)

    session = relationship("PracticeSession", back_populates="bookings")
    student = relationship("User")

class Certification(Base):
    __tablename__ = "certifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id"), nullable=False)
    issue_date = Column(DateTime, default=datetime.utcnow)
    expiration_date = Column(DateTime, nullable=False)
    certificate_code = Column(String, unique=True, nullable=False)
    pdf_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Company(Base):
    __tablename__ = "companies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    nit = Column(String, unique=True, nullable=False)
    contact_email = Column(String, nullable=False)
    subscription_status = Column(String, default="ACTIVE")
    created_at = Column(DateTime, default=datetime.utcnow)

    employees = relationship("User", back_populates="company")

class EquipmentType(str, enum.Enum):
    HARNESS = "HARNESS"
    HELMET = "HELMET"
    ROPE = "ROPE"
    CARABINER = "CARABINER"
    OTHER = "OTHER"

class EquipmentStatus(str, enum.Enum):
    OPERATIONAL = "OPERATIONAL"
    DAMAGED = "DAMAGED"
    MAINTENANCE = "MAINTENANCE"
    RETIRED = "RETIRED"

class Equipment(Base):
    __tablename__ = "equipment"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    serial_number = Column(String, unique=True, nullable=False)
    type = Column(Enum(EquipmentType), nullable=False)
    purchase_date = Column(DateTime, nullable=True)
    last_inspection_date = Column(DateTime, nullable=True)
    status = Column(Enum(EquipmentStatus), default=EquipmentStatus.OPERATIONAL)
    is_rescue = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    inspections = relationship("Inspection", back_populates="equipment")

class InspectionResult(str, enum.Enum):
    PASS = "PASS"
    FAIL = "FAIL"

class Inspection(Base):
    __tablename__ = "inspections"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    equipment_id = Column(UUID(as_uuid=True), ForeignKey("equipment.id"), nullable=False)
    inspector_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    date = Column(DateTime, default=datetime.utcnow)
    result = Column(Enum(InspectionResult), nullable=False)
    notes = Column(String, nullable=True)
    evidence_url = Column(String, nullable=True)

    equipment = relationship("Equipment", back_populates="inspections")
    inspector = relationship("User")

class EmergencyType(str, enum.Enum):
    ACCIDENT = "ACCIDENT"
    INCIDENT = "INCIDENT"
    RESCUE = "RESCUE"

class EmergencyStatus(str, enum.Enum):
    OPEN = "OPEN"
    RESOLVED = "RESOLVED"

class EmergencyAlert(Base):
    __tablename__ = "emergency_alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    location = Column(String, nullable=False)
    type = Column(Enum(EmergencyType), nullable=False)
    description = Column(String, nullable=True)
    status = Column(Enum(EmergencyStatus), default=EmergencyStatus.OPEN)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")

class AuditAction(str, enum.Enum):
    CREATE = "CREATE"
    UPDATE = "UPDATE"
    DELETE = "DELETE"
    LOGIN = "LOGIN"
    EXPORT = "EXPORT"

class AuditResourceType(str, enum.Enum):
    USER = "USER"
    CERTIFICATE = "CERTIFICATE"
    ALERT = "ALERT"
    REPORT = "REPORT"
    SYSTEM = "SYSTEM"

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    action = Column(Enum(AuditAction), nullable=False)
    resource_type = Column(Enum(AuditResourceType), nullable=False)
    resource_id = Column(String, nullable=True)
    details = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")

class SGCDocumentType(str, enum.Enum):
    POLICY = "POLICY"
    PROCEDURE = "PROCEDURE"
    FORMAT = "FORMAT"
    MANUAL = "MANUAL"

class SGCDocument(Base):
    __tablename__ = "sgc_documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    code = Column(String, unique=True, nullable=False)
    version = Column(String, default="1.0")
    type = Column(Enum(SGCDocumentType), nullable=False)
    url = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class PQRSFType(str, enum.Enum):
    PETITION = "PETITION"
    COMPLAINT = "COMPLAINT"
    CLAIM = "CLAIM"
    SUGGESTION = "SUGGESTION"
    FELICITATION = "FELICITATION"

class PQRSFStatus(str, enum.Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    CLOSED = "CLOSED"

class PQRSF(Base):
    __tablename__ = "pqrsf"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    type = Column(Enum(PQRSFType), nullable=False)
    subject = Column(String, nullable=False)
    description = Column(String, nullable=False)
    status = Column(Enum(PQRSFStatus), default=PQRSFStatus.OPEN)
    response = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")

class Survey(Base):
    __tablename__ = "surveys"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id"), nullable=True) # Optional, can be general
    rating = Column(Integer, nullable=False) # 1-5
    comments = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    course = relationship("Course")

class WorkPermitStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    CLOSED = "CLOSED"

class WorkPermit(Base):
    __tablename__ = "work_permits"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    location = Column(String, nullable=False)
    task_description = Column(String, nullable=False)
    hazards = Column(String, nullable=True) # Stored as JSON string or comma-separated
    precautions = Column(String, nullable=True) # Stored as JSON string or comma-separated
    status = Column(Enum(WorkPermitStatus), default=WorkPermitStatus.ACTIVE)
    pdf_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")

class AttendanceStatus(str, enum.Enum):
    PRESENT = "PRESENT"
    ABSENT = "ABSENT"
    EXCUSED = "EXCUSED"

class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    enrollment_id = Column(UUID(as_uuid=True), ForeignKey("enrollments.id"), nullable=False)
    trainer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    date = Column(DateTime, nullable=False) # Date only (without time component usually, but stored as DateTime)
    status = Column(Enum(AttendanceStatus), default=AttendanceStatus.PRESENT)
    signature_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    enrollment = relationship("Enrollment", back_populates="attendance_records")
    trainer = relationship("User")
