import requests

BASE_URL = "http://localhost:8000"
LOGIN_DATA = {"username": "123456789", "password": "admin123"}

def debug_player():
    # 1. Login
    try:
        login_res = requests.post(f"{BASE_URL}/auth/login", data=LOGIN_DATA)
        if login_res.status_code != 200:
            print(f"Login failed: {login_res.text}")
            return
        
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("Login successful.")

        # 2. Get Courses to find ID
        courses_res = requests.get(f"{BASE_URL}/courses/", headers=headers)
        courses = courses_res.json()
        if not courses:
            print("No courses found.")
            return
        
        course_id = courses[0]["id"]
        print(f"Testing with Course ID: {course_id}")

        # 3. Get Player Data
        player_res = requests.get(f"{BASE_URL}/courses/{course_id}/player", headers=headers)
        if player_res.status_code == 200:
            print("Player Data Retrieved Successfully:")
            data = player_res.json()
            print(f"Course Name: {data.get('name')}")
            print(f"Modules Count: {len(data.get('modules', []))}")
            for m in data.get('modules', []):
                print(f" - Module: {m.get('title')} (ID: {m.get('id')})")
        else:
            print(f"Player Endpoint Failed: {player_res.status_code}")
            print(player_res.text)

    except Exception as e:
        print(f"Error: {e}")

def debug_db():
    from backend.database import SessionLocal
    from backend import models
    db = SessionLocal()
    try:
        courses = db.query(models.Course).all()
        print(f"Total Courses in DB: {len(courses)}")
        for c in courses:
            print(f"Course: {c.name} (ID: {c.id})")
            print(f" - Modules Count: {len(c.modules)}")
            for m in c.modules:
                print(f"   - {m.title}")
    finally:
        db.close()

if __name__ == "__main__":
    debug_player()
    # debug_db()
