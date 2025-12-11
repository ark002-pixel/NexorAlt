import requests
import sys

BASE_URL = "http://localhost:8000"

def check_course():
    # Login
    resp = requests.post(f"{BASE_URL}/auth/login", data={"username": "admin_master", "password": "password123"})
    if resp.status_code != 200:
        print("Login failed")
        return
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get Courses
    courses_resp = requests.get(f"{BASE_URL}/courses", headers=headers)
    courses = courses_resp.json()
    
    found = False
    for c in courses:
        if c["name"] == "UI Delete Test":
            print(f"COURSE FOUND: {c['id']} - {c['name']}")
            found = True
            break
            
    if not found:
        print("COURSE NOT FOUND (Deletion Successful?)")

if __name__ == "__main__":
    check_course()
