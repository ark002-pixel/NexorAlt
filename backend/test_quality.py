import requests
import time

BASE_URL = "http://localhost:8000"

def test_quality():
    # 1. Login as Student
    print("Logging in as Student...")
    student_doc = f"student_q_{int(time.time())}"
    student_data = {
        "email": f"{student_doc}@test.com",
        "full_name": "Test Student Quality",
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

    # 2. Submit PQRSF
    print("Submitting PQRSF...")
    pqrsf_data = {
        "type": "SUGGESTION",
        "subject": "Mejorar cafetería",
        "description": "Deberían vender más café."
    }
    response = requests.post(f"{BASE_URL}/quality/pqrsf", json=pqrsf_data, headers=headers)
    
    if response.status_code == 200:
        print("PQRSF Submitted Successfully.")
        print(response.json())
    else:
        print(f"PQRSF Submission Failed: {response.text}")
        return

    # 3. List PQRSF
    print("Listing PQRSF...")
    response = requests.get(f"{BASE_URL}/quality/pqrsf", headers=headers)
    tickets = response.json()
    
    if len(tickets) > 0 and tickets[0]["subject"] == "Mejorar cafetería":
        print("TEST PASSED: Found submitted ticket.")
    else:
        print("TEST FAILED: Ticket not found.")

    # 4. Submit Survey
    print("Submitting Survey...")
    survey_data = {
        "rating": 5,
        "comments": "Excelente curso",
        "course_id": None
    }
    response = requests.post(f"{BASE_URL}/quality/survey", json=survey_data, headers=headers)
    if response.status_code == 200:
        print("TEST PASSED: Survey submitted.")
    else:
        print(f"TEST FAILED: Survey submission failed: {response.text}")

if __name__ == "__main__":
    test_quality()
