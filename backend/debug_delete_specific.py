import requests
import time

BASE_URL = "http://localhost:8000"
DOC_ID = "TRAINER_TEST"

def debug_delete():
    # 1. Login Admin
    admin_doc = "admin123" # Assuming standard admin, or use the one from previous script
    # Let's try to login as the admin we created earlier or a known admin
    # "admin_debug" from previous script
    login_data = {"username": "admin_debug", "password": "admin123"} 
    
    # Try logging in, if fails, create admin
    res = requests.post(f"{BASE_URL}/auth/login", data=login_data)
    if res.status_code != 200:
        print("Creating temp admin...")
        admin_data = {
            "email": "admin_debug_2@test.com",
            "full_name": "Admin Debug 2",
            "document_id": "admin_debug",
            "role": "ADMIN",
            "password": "admin123"
        }
        requests.post(f"{BASE_URL}/auth/register", json=admin_data)
        res = requests.post(f"{BASE_URL}/auth/login", data=login_data)
    
    if res.status_code != 200:
        print(f"Login failed: {res.text}")
        return

    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Find the target user
    print(f"Searching for user with document_id: {DOC_ID}")
    res = requests.get(f"{BASE_URL}/auth/users", headers=headers)
    users = res.json()
    target_user = next((u for u in users if u["document_id"] == DOC_ID), None)
    
    if not target_user:
        print("User not found in list.")
        # Print all to see what's there
        # print([u["document_id"] for u in users])
        return

    print(f"Found user: {target_user['id']}")

    # 3. Delete
    print(f"Attempting DELETE...")
    res = requests.delete(f"{BASE_URL}/auth/users/{target_user['id']}", headers=headers)
    
    print(f"Status Code: {res.status_code}")
    with open("last_error.txt", "w") as f:
        f.write(res.text)
    print(f"Response written to last_error.txt")

if __name__ == "__main__":
    debug_delete()
