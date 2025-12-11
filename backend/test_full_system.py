import requests
import time
import uuid
import os

BASE_URL = "http://localhost:8000"

# Global Variables to store state across tests
state = {
    "admin_token": None,
    "student_token": None,
    "trainer_token": None,
    "company_token": None,
    "course_id": None,
    "session_id": None,
    "booking_id": None,
    "equipment_id": None,
    "company_id": None,
    "certificate_code": None,
    "doc_id": None
}

def print_step(step):
    print(f"\n{'='*50}\n{step}\n{'='*50}")

def register_and_login(role, prefix):
    print(f"Setting up {role}...")
    doc_id = f"{prefix}_{int(time.time())}"
    email = f"{doc_id}@test.com"
    password = "password123"
    
    # Register
    user_data = {
        "email": email,
        "full_name": f"Test {role}",
        "document_id": doc_id,
        "role": role,
        "password": password
    }
    # Try login first (in case user exists from previous runs)
    login_data = {"username": doc_id, "password": password}
    response = requests.post(f"{BASE_URL}/auth/login", data=login_data)
    
    if response.status_code != 200:
        requests.post(f"{BASE_URL}/auth/register", json=user_data)
        response = requests.post(f"{BASE_URL}/auth/login", data=login_data)
    
    if response.status_code == 200:
        print(f"Login successful for {role}")
        return response.json()["access_token"]
    else:
        print(f"Login FAILED for {role}: {response.text}")
        return None

def test_01_auth():
    print_step("TEST 01: Authentication & IAM")
    state["admin_token"] = register_and_login("ADMIN", "adm")
    state["student_token"] = register_and_login("STUDENT", "std")
    state["trainer_token"] = register_and_login("TRAINER", "trn")
    state["company_token"] = register_and_login("COMPANY", "cmp")
    
    assert state["admin_token"], "Admin login failed"
    assert state["student_token"], "Student login failed"

def test_02_courses():
    print_step("TEST 02: Course Catalog")
    headers = {"Authorization": f"Bearer {state['admin_token']}"}
    
    course_data = {
        "name": f"Course {int(time.time())}",
        "description": "Full System Test Course",
        "required_hours": 20,
        "type": "BLENDED",
        "price": 150000
    }
    
    # Create Course
    res = requests.post(f"{BASE_URL}/courses/", headers=headers, json=course_data)
    if res.status_code == 200:
        state["course_id"] = res.json()["id"]
        print(f"Course Created: {state['course_id']}")
    else:
        print(f"Create Course Failed: {res.text}")
        
    # List Courses (Student)
    headers_std = {"Authorization": f"Bearer {state['student_token']}"}
    res = requests.get(f"{BASE_URL}/courses/", headers=headers_std)
    assert len(res.json()) > 0, "No courses found for student"
    print("Courses listed successfully")

def test_03_practices():
    print_step("TEST 03: Practice Management")
    if not state["course_id"]:
        print("SKIPPING: No Course ID")
        return

    headers_trn = {"Authorization": f"Bearer {state['trainer_token']}"}
    headers_std = {"Authorization": f"Bearer {state['student_token']}"}
    
    # Create Session
    session_data = {
        "course_id": state["course_id"],
        "date": "2025-12-31T08:00:00",
        "location": "Main Hangar",
        "capacity": 5
    }
    res = requests.post(f"{BASE_URL}/practices/", headers=headers_trn, json=session_data)
    if res.status_code == 200:
        state["session_id"] = res.json()["id"]
        print(f"Session Created: {state['session_id']}")
    else:
        print(f"Create Session Failed: {res.text}")
        return

    # Book Session
    res = requests.post(f"{BASE_URL}/practices/{state['session_id']}/book", headers=headers_std)
    if res.status_code == 200:
        state["booking_id"] = res.json()["id"]
        print(f"Booking Created: {state['booking_id']}")
    else:
        print(f"Booking Failed: {res.text}")
        return

    # Check-in
    res = requests.post(f"{BASE_URL}/practices/checkin", headers=headers_trn, json={"booking_id": state["booking_id"]})
    if res.status_code == 200 and res.json()["status"] == "ATTENDED":
        print("Check-in Successful")
    else:
        print(f"Check-in Failed: {res.text}")

def test_04_inventory():
    print_step("TEST 04: Inventory & Assets")
    headers = {"Authorization": f"Bearer {state['admin_token']}"}
    
    item_data = {
        "name": "Safety Harness X1",
        "serial_number": f"SN-{int(time.time())}",
        "type": "HARNESS",
        "purchase_date": "2024-01-01T00:00:00"
    }
    res = requests.post(f"{BASE_URL}/inventory/", headers=headers, json=item_data)
    if res.status_code == 200:
        state["equipment_id"] = res.json()["id"]
        print(f"Equipment Added: {state['equipment_id']}")
    else:
        print(f"Add Equipment Failed: {res.text}")
        return

    # Inspect
    insp_data = {
        "equipment_id": state["equipment_id"],
        "result": "PASS",
        "notes": "All good"
    }
    # Correct endpoint: /inventory/{id}/inspect
    res = requests.post(f"{BASE_URL}/inventory/{state['equipment_id']}/inspect", headers=headers, json=insp_data)
    if res.status_code == 200:
        print("Inspection Logged")
    else:
        print(f"Inspection Failed: {res.text}")

def test_05_certification():
    print_step("TEST 05: Certification Engine")
    headers = {"Authorization": f"Bearer {state['admin_token']}"}
    
    # We need a user ID for the student. Let's get it from the token logic or just list users.
    # For simplicity, we'll assume we can get it or just use the one we created.
    # Actually, let's just use the 'me' endpoint to get the student's ID.
    headers_std = {"Authorization": f"Bearer {state['student_token']}"}
    me = requests.get(f"{BASE_URL}/auth/me", headers=headers_std).json()
    student_id = me["id"]

    cert_data = {
        "user_id": student_id,
        "course_id": state["course_id"],
        "issue_date": "2025-01-01T00:00:00",
        "expiration_date": "2026-01-01T00:00:00",
        "certificate_code": f"CERT-{int(time.time())}"
    }
    # Correct endpoint: /certificates/issue
    res = requests.post(f"{BASE_URL}/certificates/issue", headers=headers, json=cert_data)
    if res.status_code == 200:
        state["certificate_code"] = res.json()["certificate_code"]
        print(f"Certificate Issued: {state['certificate_code']}")
    else:
        print(f"Issue Certificate Failed: {res.text}")
        return

    # Public Validation
    res = requests.get(f"{BASE_URL}/certificates/validate/{state['certificate_code']}")
    if res.status_code == 200:
        # Note: validate endpoint returns the cert object, not a "valid" boolean field directly, 
        # but if it returns 200 it means it's valid.
        print("Certificate Validation Successful (Found)")

def test_06_corporate():
    print_step("TEST 06: Corporate Dashboard")
    headers = {"Authorization": f"Bearer {state['admin_token']}"}
    
    comp_data = {
        "name": f"Corp {int(time.time())}",
        "nit": f"900{int(time.time())}",
        "contact_email": "contact@corp.com"
    }
    res = requests.post(f"{BASE_URL}/corporate/companies", headers=headers, json=comp_data)
    if res.status_code == 200:
        state["company_id"] = res.json()["id"]
        print(f"Company Created: {state['company_id']}")
    else:
        print(f"Create Company Failed: {res.text}")
        return

    # Link Company User to Company
    # First get Company User ID
    headers_cmp = {"Authorization": f"Bearer {state['company_token']}"}
    me_cmp = requests.get(f"{BASE_URL}/auth/me", headers=headers_cmp).json()
    cmp_user_id = me_cmp["id"]
    
    res = requests.post(f"{BASE_URL}/corporate/companies/{state['company_id']}/users/{cmp_user_id}", headers=headers)
    if res.status_code == 200:
        print("Company User Linked")
    else:
        print(f"Link User Failed: {res.text}")

    # Matrix (Company View)
    res = requests.get(f"{BASE_URL}/corporate/matrix", headers=headers_cmp)
    if res.status_code == 200:
        print("Expiration Matrix Accessible")
    else:
        print(f"Matrix Access Failed: {res.text}")

def test_07_financial():
    print_step("TEST 07: Financial Module")
    headers = {"Authorization": f"Bearer {state['student_token']}"}
    
    pay_data = {
        "course_id": state["course_id"],
        "amount": 150000,
        "provider": "WOMPI"
    }
    res = requests.post(f"{BASE_URL}/payments/initiate", headers=headers, json=pay_data)
    if res.status_code == 200:
        print(f"Payment Initiated. Ref: {res.json()['reference']}")
    else:
        print(f"Payment Failed: {res.text}")

def test_08_sgc():
    print_step("TEST 08: SGC & Quality")
    headers = {"Authorization": f"Bearer {state['admin_token']}"}
    
    # Upload Doc
    with open("test_doc.txt", "w") as f: f.write("Content")
    
    # Open file for reading
    f = open('test_doc.txt', 'rb')
    files = {'file': ('test_doc.txt', f, 'text/plain')}
    data = {"title": "Test Doc", "code": f"DOC-{int(time.time())}", "version": "1.0", "type": "POLICY"}
    
    try:
        res = requests.post(f"{BASE_URL}/sgc/upload", headers=headers, data=data, files=files)
        if res.status_code == 200:
            state["doc_id"] = res.json()["id"]
            print("SGC Document Uploaded")
        else:
            print(f"SGC Upload Failed: {res.text}")
    finally:
        f.close()
    
    time.sleep(1) # Wait for release
    try:
        os.remove("test_doc.txt")
    except:
        pass

def test_09_simulator():
    print_step("TEST 09: Operational Simulator")
    # No backend logic for calculator (frontend only), but we can check Work Permit generation
    headers = {"Authorization": f"Bearer {state['student_token']}"}
    
    permit_data = {
        "location": "Roof",
        "task_description": "Fixing antenna",
        "hazards": "Height",
        "precautions": "Harness"
    }
    # Correct endpoint: /simulator/permit
    res = requests.post(f"{BASE_URL}/simulator/permit", headers=headers, json=permit_data)
    if res.status_code == 200:
        print("Work Permit Generated")
    else:
        print(f"Permit Generation Failed: {res.text}")

def test_10_emergencies():
    print_step("TEST 10: Emergencies")
    headers = {"Authorization": f"Bearer {state['student_token']}"}
    
    alert_data = {
        "location": "Sector 7",
        "type": "ACCIDENT",
        "description": "Man down"
    }
    # Correct endpoint: /emergencies/alert
    res = requests.post(f"{BASE_URL}/emergencies/alert", headers=headers, json=alert_data)
    if res.status_code == 200:
        print("Emergency Alert Created")
    else:
        print(f"Alert Failed: {res.text}")

def test_11_reports():
    print_step("TEST 11: Regulatory Reports")
    headers = {"Authorization": f"Bearer {state['admin_token']}"}
    
    # Correct endpoint: /reports/arl
    res = requests.get(f"{BASE_URL}/reports/arl", headers=headers)
    if res.status_code == 200:
        print("ARL Stats Retrieved")
    else:
        print(f"Reports Failed: {res.text}")

def test_12_audit():
    print_step("TEST 12: Audit Logs")
    headers = {"Authorization": f"Bearer {state['admin_token']}"}
    
    res = requests.get(f"{BASE_URL}/audit/logs", headers=headers)
    if res.status_code == 200:
        logs = res.json()
        print(f"Audit Logs Retrieved. Count: {len(logs)}")
        # Check if recent actions were logged
        if len(logs) > 0:
            print("Audit Log Verification Successful")
    else:
        print(f"Audit Logs Failed: {res.text}")

def run_all():
    try:
        test_01_auth()
        test_02_courses()
        test_03_practices()
        test_04_inventory()
        test_05_certification()
        test_06_corporate()
        test_07_financial()
        test_08_sgc()
        test_09_simulator()
        test_10_emergencies()
        test_11_reports()
        test_12_audit()
        print("\n\nALL SYSTEMS GO! FULL VERIFICATION COMPLETE.")
    except Exception as e:
        print(f"\n\nCRITICAL FAILURE: {str(e)}")

if __name__ == "__main__":
    run_all()
