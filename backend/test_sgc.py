import requests
import time
import os

BASE_URL = "http://localhost:8000"

def test_sgc():
    # 1. Login as Admin
    print("Logging in as Admin...")
    admin_doc = "1234567890" 
    login_data = {"username": admin_doc, "password": "password123"}
    response = requests.post(f"{BASE_URL}/auth/login", data=login_data)
    
    if response.status_code != 200:
        print("Admin login failed. Registering new admin...")
        admin_doc = f"admin_sgc_{int(time.time())}"
        admin_data = {
            "email": f"{admin_doc}@test.com",
            "full_name": "Test Admin SGC",
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

    # 2. Upload SGC Document
    print("Uploading SGC Document...")
    
    # Create a dummy file
    with open("test_policy.txt", "w") as f:
        f.write("This is a test policy document.")
        
    files = {'file': ('test_policy.txt', open('test_policy.txt', 'rb'), 'text/plain')}
    data = {
        "title": "Test Policy",
        "code": f"POL-{int(time.time())}",
        "version": "1.0",
        "type": "POLICY"
    }
    
    response = requests.post(f"{BASE_URL}/sgc/upload", headers=headers, data=data, files=files)
    
    if response.status_code == 200:
        doc = response.json()
        doc_id = doc["id"]
        print(f"Document uploaded: {doc['title']} (ID: {doc_id})")
    else:
        print(f"Upload Failed: {response.text}")
        return

    # 3. List Documents
    print("Listing SGC Documents...")
    response = requests.get(f"{BASE_URL}/sgc/documents", headers=headers)
    if response.status_code == 200:
        docs = response.json()
        print(f"Documents found: {len(docs)}")
        found = any(d['id'] == doc_id for d in docs)
        if found:
            print("TEST PASSED: Uploaded document found in list.")
        else:
            print("TEST FAILED: Uploaded document NOT found in list.")
    else:
        print(f"List Failed: {response.text}")

    # 4. Delete Document
    print("Deleting SGC Document...")
    response = requests.delete(f"{BASE_URL}/sgc/documents/{doc_id}", headers=headers)
    if response.status_code == 200:
        print("Document deleted.")
    else:
        print(f"Delete Failed: {response.text}")

    # Clean up
    os.remove("test_policy.txt")

if __name__ == "__main__":
    test_sgc()
