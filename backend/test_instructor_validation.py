import requests
from datetime import datetime, timedelta
import time

BASE_URL = "http://localhost:8000"

def run_test():
    print("=== STARTING INSTRUCTOR VALIDATION TEST ===")
    
    # 1. Login Admin
    login_data = {"username": "admin_debug", "password": "admin123"}
    res = requests.post(f"{BASE_URL}/auth/login", data=login_data)
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create Trainer with NO License
    print("\n[2] Creating Trainer (No License)...")
    trainer_doc = f"tr_nolic_{int(time.time())}"
    payload = {
        "full_name": "Trainer No License",
        "document_id": trainer_doc,
        "email": f"{trainer_doc}@test.com",
        "role": "TRAINER",
        "password": "password123",
        "license_expiration": None # Explicitly None
    }
    res = requests.post(f"{BASE_URL}/auth/register", json=payload)
    trainer_id = res.json()["id"]
    print(f"Trainer Created: {trainer_id}")

    # 3. Try to Assign Course (Should Fail)
    print("\n[3] Attempting to Create Course with No-License Trainer...")
    course_data = {
        "name": f"Course Blocked {trainer_doc}",
        "code": f"CB_{int(time.time())}",
        "required_hours": 10,
        "price": 0,
        "type": "PRACTICE",
        "trainer_id": trainer_id
    }
    res = requests.post(f"{BASE_URL}/courses/", json=course_data, headers=headers)
    if res.status_code == 400:
        print(f"SUCCESS: Blocked as expected. Msg: {res.json()['detail']}")
    else:
        print(f"FAILED: Course created unexpectedy! Status: {res.status_code}")

    # 4. Update Trainer with EXPIRED License
    print("\n[4] Updating Trainer with EXPIRED License...")
    expired_date = (datetime.utcnow() - timedelta(days=10)).strftime("%Y-%m-%dT%H:%M:%S")
    update_payload = {
        "full_name": "Trainer Expired",
        "email": f"{trainer_doc}@test.com",
        "role": "TRAINER",
        "license_expiration": expired_date
    }
    res = requests.put(f"{BASE_URL}/auth/users/{trainer_id}", json=update_payload, headers=headers)
    
    # 5. Try to Assign Course (Should Fail)
    print("\n[5] Attempting to Create Course with Expired Trainer...")
    course_data["code"] = f"CB2_{int(time.time())}" # New code
    res = requests.post(f"{BASE_URL}/courses/", json=course_data, headers=headers)
    if res.status_code == 400:
        print(f"SUCCESS: Blocked as expected. Msg: {res.json()['detail']}")
    else:
        print(f"FAILED: Course created unexpectedy! Status: {res.status_code}")

    # 6. Update Trainer with VALID License
    print("\n[6] Updating Trainer with VALID License...")
    valid_date = (datetime.utcnow() + timedelta(days=365)).strftime("%Y-%m-%dT%H:%M:%S")
    update_payload["license_expiration"] = valid_date
    res = requests.put(f"{BASE_URL}/auth/users/{trainer_id}", json=update_payload, headers=headers)

    # 7. Try to Assign Course (Should Success)
    print("\n[7] Attempting to Create Course with Valid Trainer...")
    course_data["code"] = f"CV_{int(time.time())}"
    res = requests.post(f"{BASE_URL}/courses/", json=course_data, headers=headers)
    if res.status_code == 200:
        print(f"SUCCESS: Course created. ID: {res.json()['id']}")
    else:
        print(f"FAILED: Could not create course. Status: {res.status_code} - {res.text}")

if __name__ == "__main__":
    run_test()
