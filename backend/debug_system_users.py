import requests
import json

BASE_URL = "http://localhost:8000"

def test_system_users():
    print("Logging in...")
    login_data = {"username": "admin_debug", "password": "admin123"}
    res = requests.post(f"{BASE_URL}/auth/login", data=login_data)
    if res.status_code != 200:
        print(f"Login failed: {res.text}")
        return
    
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    print("Fetching system users...")
    try:
        res = requests.get(f"{BASE_URL}/auth/system-users", headers=headers, timeout=5)
        print(f"Status: {res.status_code}")
        if res.status_code == 200:
            users = res.json()
            print(f"Count: {len(users)}")
            if len(users) > 0:
                print("First user sample:")
                print(json.dumps(users[0], indent=2))
        else:
            print(f"Error: {res.text}")
    except Exception as e:
        print(f"Exception calling endpoint: {e}")

if __name__ == "__main__":
    test_system_users()
