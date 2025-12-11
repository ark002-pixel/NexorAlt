from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
import models, schemas, database, auth
import hashlib
import os

router = APIRouter(
    prefix="/payments",
    tags=["payments"]
)

# Wompi secrets (Mock for dev)
WOMPI_INTEGRITY_SECRET = "test_integrity_secret"
WOMPI_EVENTS_SECRET = "test_events_secret"

@router.post("/initiate", response_model=dict)
def initiate_payment(payment_data: schemas.PaymentCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Create payment record
    new_payment = models.Payment(
        user_id=current_user.id,
        amount=payment_data.amount,
        status=models.PaymentStatus.PENDING,
        provider=payment_data.provider
    )
    db.add(new_payment)
    db.commit()
    db.refresh(new_payment)

    # Generate reference and signature for Wompi
    reference = str(new_payment.id)
    amount_in_cents = payment_data.amount * 100 # Wompi expects cents
    currency = "COP"
    
    # Signature: SHA256(Reference + AmountInCents + Currency + IntegritySecret)
    signature_str = f"{reference}{amount_in_cents}{currency}{WOMPI_INTEGRITY_SECRET}"
    signature = hashlib.sha256(signature_str.encode()).hexdigest()

    return {
        "reference": reference,
        "signature": signature,
        "amount_in_cents": amount_in_cents,
        "currency": currency,
        "public_key": "pub_test_X5w4c8..." # Mock public key
    }

@router.post("/wompi-webhook")
async def wompi_webhook(request: Request, db: Session = Depends(database.get_db)):
    # Verify signature (Simplified for mock)
    data = await request.json()
    
    # Extract data from Wompi event
    event_type = data.get("event")
    if event_type != "transaction.updated":
        return {"status": "ignored"}
    
    transaction = data.get("data", {}).get("transaction", {})
    reference = transaction.get("reference")
    status = transaction.get("status") # APPROVED, DECLINED, VOIDED, ERROR
    
    # Find payment
    try:
        payment_id = UUID(reference)
        payment = db.query(models.Payment).filter(models.Payment.id == payment_id).first()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid reference format")

    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    # Update status
    if status == "APPROVED":
        payment.status = models.PaymentStatus.APPROVED
        
        # Generate Invoice
        try:
            # Fetch user and course info (Assuming course info is available or generic)
            user = db.query(models.User).filter(models.User.id == payment.user_id).first()
            # For MVP, we don't have course_id in Payment, so we'll use a placeholder or try to find it
            # In a real app, Payment should have course_id or order_id
            course_name = "Curso de Alturas (Referencia)" 
            
            from utils.invoice_generator import generate_invoice_pdf
            invoice_path = generate_invoice_pdf(payment, user, course_name)
            payment.invoice_url = invoice_path
            print(f"Invoice generated: {invoice_path}")
        except Exception as e:
            print(f"Error generating invoice: {e}")

    elif status == "DECLINED" or status == "ERROR":
        payment.status = models.PaymentStatus.REJECTED
    
    payment.transaction_id = transaction.get("id")
    db.commit()

    return {"status": "received"}
