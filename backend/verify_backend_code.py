import requests
import datetime

BASE_URL = "http://localhost:8000"

def verify():
    # 1. Login
    # 1. Login
    try:
        resp = requests.post(f"{BASE_URL}/auth/login", data={"username": "admin_master", "password": "password123"})
        if resp.status_code != 200:
            print(f"Login failed: {resp.text}")
            return
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # 2. Create Course
        # Name: Backend Test
        # Date: Tomorrow
        tomorrow = (datetime.datetime.now() + datetime.timedelta(days=1)).isoformat()
        
        data = {
            "name": "Backend Test Course",
            "required_hours": 40,
            "type": "PRACTICE",
            "price": 100000,
            "start_date": tomorrow,
            "location": "Script Lab",
            "capacity": 10,
            "required_documents": "[]"
        }
        
        print("Creating course...")
        create_resp = requests.post(f"{BASE_URL}/courses/", json=data, headers=headers)
        if create_resp.status_code != 200:
            print(f"Create failed: {create_resp.text}")
            return
            
        course = create_resp.json()
        print(f"Course Created: {course['name']}")
        print(f"Generated Code: {course.get('code')}")
        
        if course.get('code'):
            print("SUCCESS: Code generation works.")
        else:
            print("FAILURE: Code is missing.")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    verify()
