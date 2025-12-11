import requests
import time

BASE_URL = "http://localhost:8000"

def test_audit():
    # 1. Login as Admin
    print("Logging in as Admin...")
    admin_doc = "1234567890" # Assuming this user exists
    login_data = {"username": admin_doc, "password": "password123"}
    response = requests.post(f"{BASE_URL}/auth/login", data=login_data)
    
    if response.status_code != 200:
        print("Admin login failed. Registering new admin...")
        admin_doc = f"admin_audit_{int(time.time())}"
        admin_data = {
            "email": f"{admin_doc}@test.com",
            "full_name": "Test Admin Audit",
            "document_id": admin_doc,
            "role": "ADMIN",
            "password": "password123"
        }
        requests.post(f"{BASE_URL}/auth/register", json=admin_data)
        login_data = {"username": admin_doc, "password": "password123"}
        response = requests.post(f"{BASE_URL}/auth/login", data=login_data)

    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("Admin logged in.")

    # 2. Trigger an action that should be logged (e.g., create an alert)
    # Note: We need to ensure that the alert creation actually calls log_action.
    # Since I haven't updated the other routers to call log_action yet, 
    # I will first verify that the audit endpoint returns an empty list or existing logs,
    # and then I will update a router to use the logging utility.
    
    print("Listing Audit Logs...")
    response = requests.get(f"{BASE_URL}/audit/logs", headers=headers)
    
    if response.status_code == 200:
        logs = response.json()
        print(f"Audit Logs Count: {len(logs)}")
        print("TEST PASSED: Audit logs endpoint accessible.")
    else:
        print(f"Audit Logs List Failed: {response.text}")

if __name__ == "__main__":
    test_audit()
