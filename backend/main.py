from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import auth, documents, courses, practices, corporate, inventory, certificates, payments, quality, simulator, emergencies, reports, audit, sgc_documents, attendance, modules

from fastapi.staticfiles import StaticFiles
import os

# Create uploads directory if not exists
os.makedirs("uploads", exist_ok=True)

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="NexorAlturas API",
    description="API para la plataforma de certificación de trabajo seguro en alturas.",
    version="1.0.0"
)

# CORS Configuration - MUST BE BEFORE ROUTERS to handle errors correctly
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for debugging
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory if not exists
os.makedirs("uploads", exist_ok=True)

# Create tables
Base.metadata.create_all(bind=engine)

# Include Routers
app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(courses.router)
app.include_router(practices.router)
app.include_router(corporate.router)
app.include_router(inventory.router)
app.include_router(certificates.router)
app.include_router(payments.router)
app.include_router(quality.router)
app.include_router(simulator.router)
app.include_router(emergencies.router)
app.include_router(reports.router)
app.include_router(audit.router)
app.include_router(sgc_documents.router)
app.include_router(attendance.router)
app.include_router(modules.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to NexorAlturas API", "status": "running"}

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
