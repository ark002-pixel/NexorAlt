import requests
import hashlib
import time
from sqlalchemy import create_engine, text

BASE_URL = "http://localhost:8000"
DB_URL = "postgresql://nexor_user:nexor_password@localhost:5432/nexor_db"
WOMPI_INTEGRITY_SECRET = "test_integrity_secret"

def get_db_connection():
    engine = create_engine(DB_URL)
    return engine.connect()

def test_payments():
    # 1. Login as Student
    print("Logging in as Student...")
    # Register a new student for clean test
    student_doc = f"student_{int(time.time())}"
    student_data = {
        "email": f"{student_doc}@test.com",
        "full_name": "Test Student Payment",
        "document_id": student_doc,
        "role": "STUDENT",
        "password": "password123"
    }
    requests.post(f"{BASE_URL}/auth/register", json=student_data)
    
    login_data = {"username": student_doc, "password": "password123"}
    response = requests.post(f"{BASE_URL}/auth/login", data=login_data)
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("Student logged in.")

    # 2. Initiate Payment
    print("Initiating Payment...")
    payment_data = {
        "course_id": "d84a4bdc-3579-4861-b8e2-9189b3f89700", # Using existing course ID from previous test or random UUID
        "amount": 100000,
        "provider": "WOMPI"
    }
    response = requests.post(f"{BASE_URL}/payments/initiate", json=payment_data, headers=headers)
    
    if response.status_code != 200:
        print(f"Payment initiation failed: {response.text}")
        return

    data = response.json()
    reference = data["reference"]
    signature = data["signature"]
    print(f"Payment Initiated. Reference: {reference}")

    # 3. Simulate Wompi Webhook (Approved)
    print("Simulating Wompi Webhook (Approved)...")
    webhook_data = {
        "event": "transaction.updated",
        "data": {
            "transaction": {
                "id": f"tr_{int(time.time())}",
                "reference": reference,
                "status": "APPROVED",
                "amount_in_cents": 10000000,
                "currency": "COP"
            }
        },
        "signature": {
            "checksum": "mock_checksum" # We mocked verification in backend for now
        }
    }
    
    response = requests.post(f"{BASE_URL}/payments/wompi-webhook", json=webhook_data)
    print(f"Webhook Response: {response.json()}")

    # 4. Verify Payment Status and Invoice in DB
    print("Verifying Payment Status in DB...")
    with get_db_connection() as conn:
        result = conn.execute(text("SELECT status, invoice_url FROM payments WHERE id = :id"), {"id": reference}).fetchone()
        if result and result[0] == "APPROVED":
            print("TEST PASSED: Payment status is APPROVED.")
            if result[1]:
                print(f"TEST PASSED: Invoice URL found: {result[1]}")
            else:
                print("TEST FAILED: Invoice URL not found.")
        else:
            print(f"TEST FAILED: Payment status is {result[0] if result else 'None'}")

if __name__ == "__main__":
    test_payments()
