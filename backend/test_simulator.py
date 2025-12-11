import requests
import time

BASE_URL = "http://localhost:8000"

def test_simulator():
    # 1. Login as Student
    print("Logging in as Student...")
    student_doc = f"student_sim_{int(time.time())}"
    student_data = {
        "email": f"{student_doc}@test.com",
        "full_name": "Test Student Simulator",
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

    # 2. Create Work Permit
    print("Creating Work Permit...")
    permit_data = {
        "location": "Torre A - Nivel 5",
        "task_description": "Mantenimiento de luminarias",
        "hazards": "Altura, Eléctrico",
        "precautions": "Arnés, Casco, Bloqueo de energía"
    }
    response = requests.post(f"{BASE_URL}/simulator/permit", json=permit_data, headers=headers)
    
    if response.status_code == 200:
        print("Permit Created Successfully.")
        permit = response.json()
        print(permit)
        
        if permit["pdf_url"] and "permits" in permit["pdf_url"]:
            print("TEST PASSED: PDF URL generated.")
        else:
            print("TEST FAILED: PDF URL missing.")
    else:
        print(f"Permit Creation Failed: {response.text}")
        return

    # 3. List Permits
    print("Listing Permits...")
    response = requests.get(f"{BASE_URL}/simulator/permits", headers=headers)
    permits = response.json()
    
    if len(permits) > 0 and permits[0]["location"] == "Torre A - Nivel 5":
        print("TEST PASSED: Found created permit.")
    else:
        print("TEST FAILED: Permit not found.")

if __name__ == "__main__":
    test_simulator()
