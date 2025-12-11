import requests
import time

BASE_URL = "http://localhost:8000"

def debug_update():
    # 1. Login/Create Admin
    admin_doc = "admin_debug"
    admin_data = {
        "email": "admin_debug@test.com",
        "full_name": "Admin Debug",
        "document_id": admin_doc,
        "role": "ADMIN",
        "password": "admin123"
    }
    # Try register (might fail if exists)
    requests.post(f"{BASE_URL}/auth/register", json=admin_data)
    
    # Login
    login_data = {"username": admin_doc, "password": "admin123"}
    res = requests.post(f"{BASE_URL}/auth/login", data=login_data)
    if res.status_code != 200:
        print(f"Admin Login Failed: {res.text}")
        return
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("Admin Logged In.")

    # 2. Create Trainer to Edit
    trainer_doc = f"trainer_{int(time.time())}"
    trainer_data = {
        "email": f"{trainer_doc}@test.com",
        "full_name": "Test Trainer",
        "document_id": trainer_doc,
        "role": "TRAINER",
        "password": "trainer123"
    }
    res = requests.post(f"{BASE_URL}/auth/register", json=trainer_data)
    if res.status_code != 200:
        print(f"Trainer Register Failed: {res.text}")
        return
    trainer_user = res.json()
    trainer_id = trainer_user["id"]
    print(f"Trainer Created: {trainer_id}")

    # 3. Attempt to Update Trainer (Change Name and Phone)
    # Payload matching UserUpdate schema (UserBase fields + optional password)
    update_payload = {
        "email": trainer_data["email"],
        "full_name": "Test Trainer Updated",
        "document_id": trainer_data["document_id"],
        "role": "TRAINER",
        # Optional fields
        "phone": "1234567890",
        "address": "Calle 123",
        "password": "" # Empty password as frontend sends
    }
    
    print(f"Updating Trainer {trainer_id} with payload: {update_payload}")
    res = requests.put(f"{BASE_URL}/auth/users/{trainer_id}", json=update_payload, headers=headers)
    
    if res.status_code == 200:
        print("UPDATE SUCCESSFUL!")
        print(res.json())
    else:
        print(f"UPDATE FAILED: {res.status_code}")
        print(res.text)

if __name__ == "__main__":
    debug_update()
