import requests
import sys

BASE_URL = "http://localhost:8000"

def verify_api():
    # 1. Login
    try:
        resp = requests.post(f"{BASE_URL}/auth/login", data={
            "username": "123456789",
            "password": "admin123"
        })
        if resp.status_code != 200:
            print(f"Login failed: {resp.text}")
            return
        
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("Login Successful.")

        # 2. Get Courses
        resp = requests.get(f"{BASE_URL}/courses", headers=headers)
        courses = resp.json()
        print(f"Found {len(courses)} courses.")
        
        target_course = None
        for c in courses:
            # Try to find one we seeded or auto-populated
            if "Básico" in c['name'] or "Prueba" in c['name'] or "Test" in c['name']:
                target_course = c
                break
        
        if not target_course and courses:
            target_course = courses[0] # Fallback
            
        if not target_course:
            print("No courses found to test.")
            return

        print(f"Testing Course: {target_course['name']} (ID: {target_course['id']})")

        # 3. Get Modules
        resp = requests.get(f"{BASE_URL}/modules/course/{target_course['id']}", headers=headers)
        if resp.status_code != 200:
            print(f"Failed to get modules: {resp.text}")
            return
            
        modules = resp.json()
        print(f"Modules found: {len(modules)}")
        
        for m in modules:
            print(f" - Title: {m.get('title')}")
            print(f"   Desc:  {m.get('description')}")
            print(f"   Order: {m.get('order_index')}")

        if len(modules) == 0:
            print("!!! WARNING: API returned 0 modules.")
        else:
            print("API verification PASSED (Data exists).")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    verify_api()
