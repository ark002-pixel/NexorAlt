from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
import os
from datetime import datetime

def generate_permit_pdf(permit, user):
    # Ensure directory exists
    output_dir = "permits"
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    filename = f"permit_{permit.id}.pdf"
    filepath = os.path.join(output_dir, filename)

    c = canvas.Canvas(filepath, pagesize=letter)
    width, height = letter

    # Header
    c.setFont("Helvetica-Bold", 18)
    c.drawString(50, height - 50, "PERMISO DE TRABAJO EN ALTURAS")
    
    c.setFont("Helvetica", 10)
    c.drawString(50, height - 70, f"ID Permiso: {permit.id}")
    c.drawString(50, height - 85, f"Fecha: {permit.created_at.strftime('%Y-%m-%d %H:%M')}")

    # User Info
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, height - 120, "Información del Trabajador")
    c.setFont("Helvetica", 10)
    c.drawString(50, height - 140, f"Nombre: {user.full_name}")
    c.drawString(50, height - 155, f"Documento: {user.document_id}")

    # Job Info
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, height - 190, "Detalles del Trabajo")
    c.setFont("Helvetica", 10)
    c.drawString(50, height - 210, f"Ubicación: {permit.location}")
    c.drawString(50, height - 225, f"Descripción: {permit.task_description}")

    # Hazards
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, height - 260, "Peligros Identificados")
    c.setFont("Helvetica", 10)
    hazards = permit.hazards.split(',') if permit.hazards else []
    y = height - 280
    for h in hazards:
        c.drawString(60, y, f"- {h.strip()}")
        y -= 15

    # Precautions
    y -= 20
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, y, "Precauciones Requeridas")
    y -= 20
    c.setFont("Helvetica", 10)
    precautions = permit.precautions.split(',') if permit.precautions else []
    for p in precautions:
        c.drawString(60, y, f"- {p.strip()}")
        y -= 15

    # Signatures
    y -= 50
    c.line(50, y, 250, y)
    c.drawString(50, y - 15, "Firma del Trabajador")

    c.line(300, y, 500, y)
    c.drawString(300, y - 15, "Firma del Supervisor")

    c.save()
    return filepath
