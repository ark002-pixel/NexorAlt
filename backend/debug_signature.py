import requests
import json
import base64

BASE_URL = "http://localhost:8000"

def debug_signature():
    # 1. Login
    print("Logging in...")
    resp = requests.post(f"{BASE_URL}/auth/login", data={
        "username": "99999",
        "password": "debug123"
    })
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Get Courses
    courses = requests.get(f"{BASE_URL}/courses/", headers=headers).json()
    course = courses[0]
    course_id = course["id"]
    print(f"Course: {course['name']} ({course_id})")
    
    # 3. Get Enrollments (via attendance endpoint or direct DB? better via endpoint if exists, but /courses/{id}/enrollments only available via db or my-enrollments? 
    # Actually /attendance/{course_id} returns list of students/enrollments.
    print("Fetching attendance list...")
    # Need date.
    today = "2025-12-10" # Use a date that matches course duration?
    # Actually just any date is fine for fetching the list usually, or start date
    date_param = course.get("start_date", "2025-12-10").split("T")[0]
    
    att_resp = requests.get(f"{BASE_URL}/attendance/{course_id}?date={date_param}", headers=headers)
    att_data = att_resp.json()
    
    if not att_data:
        print("No enrollments found to sign.")
        return

    student = att_data[0]
    enrollment_id = student["enrollment_id"]
    print(f"Signing for Student: {student['student_name']} (Enrollment: {enrollment_id})")
    
    # 4. Create Fake Signature
    # Minimal 1x1 png base64
    fake_sig = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
    
    # 5. Send Signature
    payload = {
        "enrollment_id": enrollment_id,
        "date": date_param,
        "signature_base64": fake_sig
    }
    
    print("Uploading signature...")
    sign_resp = requests.post(f"{BASE_URL}/attendance/sign", json=payload, headers=headers)
    
    print("Status:", sign_resp.status_code)
    print("Response:", sign_resp.text)

if __name__ == "__main__":
    debug_signature()
