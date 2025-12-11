import requests
import datetime
from sqlalchemy import create_engine, text

BASE_URL = "http://localhost:8000"
DB_URL = "postgresql://nexor_user:nexor_password@localhost:5432/nexor_db"

def get_db_connection():
    engine = create_engine(DB_URL)
    return engine.connect()

def test_expiration_matrix():
    # 1. Login as Admin to create course
    print("Logging in as Admin...")
    login_data = {"username": "123456789", "password": "admin123"}
    response = requests.post(f"{BASE_URL}/auth/login", data=login_data)
    if response.status_code != 200:
        print(f"Admin login failed: {response.text}")
        return
    admin_token = response.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 2. Create Course
    print("Creating Course...")
    course_data = {
        "name": "Working at Heights Level 1",
        "description": "Basic safety course",
        "required_hours": 40,
        "type": "MANDATORY",
        "price": 100000
    }
    response = requests.post(f"{BASE_URL}/courses/", json=course_data, headers=admin_headers)
    if response.status_code == 200:
        course_id = response.json()["id"]
        print(f"Course created: {course_id}")
    else:
        print(f"Course creation failed (might exist): {response.text}")
        # Try to get existing course if creation fails
        response = requests.get(f"{BASE_URL}/courses/", headers=admin_headers)
        if response.status_code == 200 and len(response.json()) > 0:
             course_id = response.json()[0]["id"]
             print(f"Using existing course: {course_id}")
        else:
             return

    # 3. Login as Company User (from previous test)
    print("Logging in as Company User...")
    login_data = {"username": "9988776655", "password": "password123"}
    response = requests.post(f"{BASE_URL}/auth/login", data=login_data)
    if response.status_code != 200:
        print(f"Company User login failed: {response.text}")
        return
    company_token = response.json()["access_token"]
    company_headers = {"Authorization": f"Bearer {company_token}"}

    # 4. Get Employees to find one to certify
    # We don't have a GET /corporate/employees endpoint yet, so we'll query DB or assume we know one.
    # In previous test we uploaded employees with docs 111222333 and 444555666.
    employee_doc = "111222333"
    
    # Get Employee ID from DB
    employee_id = None
    with get_db_connection() as conn:
        result = conn.execute(text("SELECT id FROM users WHERE document_id = :doc"), {"doc": employee_doc}).fetchone()
        if result:
            employee_id = str(result[0])
            print(f"Found employee {employee_doc}: {employee_id}")
        else:
            print(f"Employee {employee_doc} not found in DB.")
            return

    # 5. Issue Certification (Admin does this)
    print("Issuing Certification...")
    # Calculate dates
    issue_date = datetime.datetime.now()
    expiration_date = issue_date + datetime.timedelta(days=20) # Expiring soon (< 30 days)
    
    cert_data = {
        "user_id": employee_id,
        "course_id": course_id,
        "issue_date": issue_date.isoformat(),
        "expiration_date": expiration_date.isoformat(),
        "certificate_code": f"CERT-{employee_doc}-{course_id[:4]}"
    }
    
    response = requests.post(f"{BASE_URL}/certificates/issue", json=cert_data, headers=admin_headers)
    if response.status_code == 200:
        print("Certification issued.")
    else:
        print(f"Certification issue failed: {response.text}")
        # Proceed anyway, maybe it already exists

    # 6. Fetch Matrix as Company
    print("Fetching Expiration Matrix...")
    response = requests.get(f"{BASE_URL}/corporate/matrix", headers=company_headers)
    
    print(f"Matrix Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Matrix Data: {len(data)} records")
        for item in data:
            print(f"- {item['employee_name']} | {item['course_name']} | Status: {item['status']} | Days: {item['days_remaining']}")
            
        # Verify we have at least one record and status is EXPIRING_SOON
        found = False
        for item in data:
            if item['document_id'] == employee_doc and item['status'] == 'EXPIRING_SOON':
                found = True
                break
        
        if found:
            print("TEST PASSED: Found expiring certification.")
        else:
            print("TEST FAILED: Did not find expected expiring certification.")
    else:
        print(f"Matrix fetch failed: {response.text}")
        print("TEST FAILED")

if __name__ == "__main__":
    test_expiration_matrix()
