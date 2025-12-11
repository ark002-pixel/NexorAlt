import requests
import pandas as pd
import io
from sqlalchemy import create_engine, text
import time

BASE_URL = "http://localhost:8000"
DB_URL = "postgresql://nexor_user:nexor_password@localhost:5432/nexor_db"

def get_db_connection():
    engine = create_engine(DB_URL)
    return engine.connect()

def test_bulk_upload():
    # 1. Login as Admin
    print("Logging in as Admin...")
    login_data = {"username": "123456789", "password": "admin123"}
    response = requests.post(f"{BASE_URL}/auth/login", data=login_data)
    if response.status_code != 200:
        print(f"Admin login failed: {response.text}")
        return
    admin_token = response.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("Admin logged in.")

    # 2. Create Company
    print("Creating Company...")
    company_data = {
        "name": "Test Corp Bulk Upload",
        "nit": "900123456-7",
        "contact_email": "contact@testcorp.com"
    }
    response = requests.post(f"{BASE_URL}/corporate/companies", json=company_data, headers=admin_headers)
    if response.status_code == 200:
        company_id = response.json()["id"]
        print(f"Company created: {company_id}")
    else:
        print(f"Company creation failed (might already exist): {response.text}")
        # If it fails, we can't proceed easily without the ID. 
        # But for this test environment, we assume it works or we can debug.
        return

    # 3. Create Company User
    print("Creating Company User...")
    user_data = {
        "email": "company_admin@testcorp.com",
        "full_name": "Company Admin",
        "document_id": "9988776655",
        "role": "COMPANY",
        "password": "password123"
    }
    response = requests.post(f"{BASE_URL}/auth/register", json=user_data)
    if response.status_code == 200:
        print("Company User created.")
    elif response.status_code == 400 and "already registered" in response.text:
        print("Company User already exists.")
    else:
        print(f"Company User creation failed: {response.text}")
        return

    # 4. Update Company User with company_id
    print("Linking User to Company in DB...")
    try:
        with get_db_connection() as conn:
            stmt = text("UPDATE users SET company_id = :company_id WHERE document_id = :document_id")
            conn.execute(stmt, {"company_id": company_id, "document_id": "9988776655"})
            conn.commit()
        print("User linked to Company.")
    except Exception as e:
        print(f"DB Update failed: {e}")
        return

    # 5. Login as Company User
    print("Logging in as Company User...")
    login_data = {"username": "9988776655", "password": "password123"}
    response = requests.post(f"{BASE_URL}/auth/login", data=login_data)
    if response.status_code != 200:
        print(f"Company User login failed: {response.text}")
        return
    company_token = response.json()["access_token"]
    company_headers = {"Authorization": f"Bearer {company_token}"}
    print("Company User logged in.")

    # 6. Create Excel File
    print("Creating Excel file...")
    df = pd.DataFrame({
        "Documento": ["111222333", "444555666"],
        "Nombre Completo": ["Employee One", "Employee Two"],
        "Email": ["emp1@testcorp.com", "emp2@testcorp.com"],
        "Cargo": ["Worker", "Supervisor"]
    })
    
    # Save to bytes
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False)
    output.seek(0)

    # 7. Upload File
    print("Uploading file...")
    files = {"file": ("employees.xlsx", output, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
    response = requests.post(f"{BASE_URL}/corporate/employees/upload", headers=company_headers, files=files)
    
    print(f"Upload Status: {response.status_code}")
    print(f"Upload Response: {response.json()}")

    if response.status_code == 200:
        print("TEST PASSED")
    else:
        print("TEST FAILED")

if __name__ == "__main__":
    test_bulk_upload()
