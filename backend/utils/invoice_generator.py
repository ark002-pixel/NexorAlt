from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import os
from datetime import datetime

INVOICE_DIR = "invoices"

if not os.path.exists(INVOICE_DIR):
    os.makedirs(INVOICE_DIR)

def generate_invoice_pdf(payment, user, course_name):
    filename = f"invoice_{payment.id}.pdf"
    filepath = os.path.join(INVOICE_DIR, filename)
    
    c = canvas.Canvas(filepath, pagesize=letter)
    width, height = letter
    
    # Header
    c.setFont("Helvetica-Bold", 20)
    c.drawString(50, height - 50, "NEXOR ALTURAS S.A.S")
    
    c.setFont("Helvetica", 12)
    c.drawString(50, height - 70, "NIT: 900.123.456-7")
    c.drawString(50, height - 85, "Dirección: Calle 123 # 45-67, Bogotá")
    c.drawString(50, height - 100, "Email: facturacion@nexoralturas.com")
    
    # Invoice Details
    c.setFont("Helvetica-Bold", 16)
    c.drawString(400, height - 50, "FACTURA DE VENTA")
    c.setFont("Helvetica", 12)
    c.drawString(400, height - 70, f"No. {payment.id.hex[:8].upper()}")
    c.drawString(400, height - 85, f"Fecha: {datetime.now().strftime('%Y-%m-%d')}")
    
    # Customer Details
    c.line(50, height - 120, width - 50, height - 120)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, height - 140, "Cliente:")
    c.setFont("Helvetica", 12)
    c.drawString(50, height - 155, f"Nombre: {user.full_name}")
    c.drawString(50, height - 170, f"Documento: {user.document_id}")
    c.drawString(50, height - 185, f"Email: {user.email}")
    
    # Items
    c.line(50, height - 210, width - 50, height - 210)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, height - 230, "Descripción")
    c.drawString(400, height - 230, "Valor")
    
    c.line(50, height - 240, width - 50, height - 240)
    
    c.setFont("Helvetica", 12)
    c.drawString(50, height - 260, f"Curso: {course_name}")
    c.drawString(400, height - 260, f"${payment.amount:,.2f} COP")
    
    # Total
    c.line(50, height - 280, width - 50, height - 280)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(300, height - 300, "TOTAL A PAGAR:")
    c.drawString(400, height - 300, f"${payment.amount:,.2f} COP")
    
    # Footer
    c.setFont("Helvetica-Oblique", 10)
    c.drawString(50, 50, "Esta factura se asimila en todos sus efectos a una letra de cambio (Art. 774 del Código de Comercio).")
    c.drawString(50, 35, "Gracias por su compra.")
    
    c.save()
    return filepath
