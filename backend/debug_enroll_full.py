import requests
import traceback
import json

BASE_URL = "http://localhost:8000"

def debug_full_flow():
    # 1. Login
    print("Logging in...")
    try:
        resp = requests.post(f"{BASE_URL}/auth/login", data={
            "username": "99999",
            "password": "debug123"
        })
        if resp.status_code != 200:
            print("Login Failed:", resp.text)
            return
        
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("Login Success. Token acquired.")
        
        # 2. Get a valid course (first one)
        print("Fetching courses...")
        courses_resp = requests.get(f"{BASE_URL}/courses/", headers=headers)
        courses = courses_resp.json()
        if not courses:
            print("No courses found. creating one...")
            # Create a dummy course if none exists
            # skipping complexity, assume one exists from previous steps
            return
            
        course_id = courses[0]["id"]
        print(f"Using Course ID: {course_id}")
        
        # 3. Get a valid user (student) - we'll use a new random one or the admin itself via self-enroll (if allowed? likely not for admin role but let's try or create a student)
        # Actually better to just try enrolling a dummy ID and see if it hits 404 (logic working) or 500 (crash)
        dummy_user_id = "34f2772e-a20d-4365-ae3b-ae5fac3efd85"
        
        print(f"Enrolling User {dummy_user_id}...")
        enroll_resp = requests.post(
            f"{BASE_URL}/courses/{course_id}/enroll-student",
            json={"user_id": dummy_user_id},
            headers=headers
        )
        
        print("Enrollment Status:", enroll_resp.status_code)
        print("Enrollment Response:", enroll_resp.text)

    except Exception:
        traceback.print_exc()

if __name__ == "__main__":
    debug_full_flow()
