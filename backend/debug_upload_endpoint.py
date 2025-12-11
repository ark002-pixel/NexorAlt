
import requests
import uuid

BASE_URL = "http://localhost:8000"

# 1. Login to get token (Admin)
def login():
    # Attempting correct endpoint found in auth.py
    url = f"{BASE_URL}/auth/login" 
    print(f"Attempting login at: {url}")
    resp = requests.post(url, data={
        "username": "99999", 
        "password": "debug123"
    })
    print(f"Login Status: {resp.status_code}")
    if resp.status_code == 200:
        return resp.json()["access_token"]
    else:
        print(resp.text)
        return None

# 2. Upload Document
def test_upload(token):
    # Get a student ID first? Or just use a known one?
    # Let's list students
    headers = {"Authorization": f"Bearer {token}"}
    students = requests.get(f"{BASE_URL}/documents/matrix", headers=headers).json()
    
    if not students:
        print("No students found to upload for.")
        return

    target_student = students[0]
    target_id = target_student["user_id"]
    print(f"Targeting Student: {target_student['full_name']} ({target_id})")

    # Prepare dummy PDF
    files = {
        'file': ('test_doc.pdf', b'%PDF-1.4 dummy content', 'application/pdf')
    }
    data = {
        'user_id': target_id,
        'type': 'HEIGHTS_ADVANCED_CERT'
    }

    print("Sending Upload Request...")
    resp = requests.post(
        f"{BASE_URL}/documents/upload-on-behalf",
        headers=headers,
        data=data,
        files=files
    )
    
    print(f"Upload Status: {resp.status_code}")
    print(f"Upload Response: {resp.text}")

if __name__ == "__main__":
    token = login()
    if token:
        test_upload(token)
