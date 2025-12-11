import requests
import time

BASE_URL = "http://localhost:8000"

def run_test():
    print("=== STARTING FULL USER FLOW TEST ===")
    
    # 1. Login as Admin
    print("\n[1] Logging in as Admin...")
    login_data = {"username": "admin_debug", "password": "admin123"}
    res = requests.post(f"{BASE_URL}/auth/login", data=login_data)
    if res.status_code != 200:
        # Emergency create if admin missing
        print("Admin missing, creating...")
        requests.post(f"{BASE_URL}/auth/register", json={
            "email": "admin_debug@test.com", "full_name": "Admin Debug",
            "document_id": "admin_debug", "role": "ADMIN", "password": "admin123"
        })
        res = requests.post(f"{BASE_URL}/auth/login", data=login_data)
    
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("Admin Logged In.")

    # 2. Create Trainer (Frontend Style Payload)
    print("\n[2] Creating Trainer (Frontend Payload)...")
    trainer_doc = f"trainer_{int(time.time())}"
    payload = {
        "full_name": "Test Trainer Full Flow",
        "document_id": trainer_doc,
        "email": f"{trainer_doc}@test.com",
        "role": "TRAINER",
        "password": "password123",
        "birth_date": None, # Sanitized
        "phone": "", "address": "" # Empty strings
    }
    res = requests.post(f"{BASE_URL}/auth/register", json=payload)
    if res.status_code != 200:
        print(f"FAILED to create trainer: {res.text}")
        return
    trainer_id = res.json()["id"]
    print(f"Trainer Created: {trainer_id}")

    # 3. Update Trainer
    print("\n[3] Updating Trainer...")
    update_payload = {
        "full_name": "Test Trainer UPDATE",
        "document_id": trainer_doc,
        "email": f"{trainer_doc}@test.com",
        "role": "TRAINER",
        "phone": "555-5555",
        "password": "" # Empty password
    }
    res = requests.put(f"{BASE_URL}/auth/users/{trainer_id}", json=update_payload, headers=headers)
    if res.status_code != 200:
        print(f"FAILED to update trainer: {res.text}")
        return
    print("Trainer Updated Successfully.")

    # 4. Assign Trainer to a New Course (Test Constraint)
    print("\n[4] Creating Course assigned to Trainer...")
    course_data = {
        "name": f"Course for {trainer_doc}",
        "code": f"C_{int(time.time())}",
        "required_hours": 10,
        "price": 0,
        "type": "PRACTICE",
        "trainer_id": trainer_id
    }
    res = requests.post(f"{BASE_URL}/courses/", json=course_data, headers=headers)
    if res.status_code != 200:
        print(f"FAILED to create course: {res.text}")
        return
    course_id = res.json()["id"]
    print(f"Course Created: {course_id} assigned to Trainer.")

    # 5. Delete Trainer (The Ultimate Test)
    print("\n[5] Deleting Trainer (Should unassign from course)...")
    res = requests.delete(f"{BASE_URL}/auth/users/{trainer_id}", headers=headers)
    
    if res.status_code == 200:
        print("Trainer DELETE SUCCESSFUL.")
    else:
        print(f"Trainer DELETE FAILED: {res.status_code} - {res.text}")
        return

    # 6. Verify Course still exists but has NO trainer
    print("\n[6] Verifying Course State...")
    # Currently no direct GET course by ID public endpoint easily accessible without iterating?
    # Actually GET /courses exists
    res = requests.get(f"{BASE_URL}/courses", headers=headers)
    courses = res.json()
    target_course = next((c for c in courses if c["id"] == course_id), None)
    
    if target_course:
        if target_course["trainer_id"] is None:
             print("VERIFIED: Course trainer_id is None.")
        else:
             print(f"FAILED: Course trainer_id is {target_course['trainer_id']}")
    else:
        print("WARNING: Course not found (Deleted?).")

    print("\n=== TEST COMPLETED SUCCESSFULLY ===")

if __name__ == "__main__":
    run_test()
