import requests
import time
import csv
import io

BASE_URL = "http://localhost:8000"

def test_reports():
    # 1. Login as Admin
    print("Logging in as Admin...")
    admin_doc = "1234567890" # Assuming this user exists
    login_data = {"username": admin_doc, "password": "password123"}
    response = requests.post(f"{BASE_URL}/auth/login", data=login_data)
    
    if response.status_code != 200:
        print("Admin login failed. Registering new admin...")
        admin_doc = f"admin_rep_{int(time.time())}"
        admin_data = {
            "email": f"{admin_doc}@test.com",
            "full_name": "Test Admin Reports",
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

    # 2. Download MinTrabajo Report (CSV)
    print("Downloading MinTrabajo Report...")
    response = requests.get(f"{BASE_URL}/reports/mintrabajo", headers=headers)
    
    if response.status_code == 200:
        content = response.text
        print("CSV Content Received.")
        # Basic validation
        if "Documento,Nombre Completo,Curso" in content or "Documento" in content:
             print("TEST PASSED: CSV Header found.")
        else:
             print("TEST FAILED: Invalid CSV content.")
             print(content[:100])
    else:
        print(f"MinTrabajo Report Failed: {response.text}")

    # 3. Download ARL Report (JSON)
    print("Downloading ARL Report...")
    response = requests.get(f"{BASE_URL}/reports/arl", headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        print("JSON Content Received.")
        if "stats" in data and "generated_at" in data:
            print("TEST PASSED: Valid JSON structure.")
            print(f"Stats count: {len(data['stats'])}")
        else:
            print("TEST FAILED: Invalid JSON structure.")
    else:
        print(f"ARL Report Failed: {response.text}")

if __name__ == "__main__":
    test_reports()
