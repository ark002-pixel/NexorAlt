import requests
import time
import uuid

BASE_URL = "http://localhost:8000"

def test_checkin():
    # 1. Login as Admin (Trainer)
    print("Logging in as Admin...")
    admin_doc = "1234567890" 
    login_data = {"username": admin_doc, "password": "password123"}
    response = requests.post(f"{BASE_URL}/auth/login", data=login_data)
    
    if response.status_code != 200:
        print("Admin login failed. Registering new admin...")
        admin_doc = f"admin_checkin_{int(time.time())}"
        admin_data = {
            "email": f"{admin_doc}@test.com",
            "full_name": "Test Admin Checkin",
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

    # 1.5 Create Course
    print("Creating Course...")
    course_data = {
        "name": "Test Course Checkin",
        "description": "Test Description",
        "required_hours": 10,
        "type": "BLENDED",
        "price": 100000
    }
    response = requests.post(f"{BASE_URL}/courses/", headers=headers, json=course_data)
    if response.status_code == 200:
        course_id = response.json()["id"]
        print(f"Course created: {course_id}")
    else:
        print(f"Create Course Failed: {response.text}")
        return

    # 2. Create Practice Session
    print("Creating Practice Session...")
    session_data = {
        "course_id": course_id,
        "date": "2025-12-31T10:00:00",
        "location": "Test Location",
        "capacity": 5
    }
    response = requests.post(f"{BASE_URL}/practices/", headers=headers, json=session_data)
    if response.status_code == 200:
        session_id = response.json()["id"]
        print(f"Session created: {session_id}")
    else:
        print(f"Create Session Failed: {response.text}")
        return

    # 3. Book Session (as Admin/Student)
    print("Booking Session...")
    response = requests.post(f"{BASE_URL}/practices/{session_id}/book", headers=headers)
    if response.status_code == 200:
        booking = response.json()
        booking_id = booking["id"]
        print(f"Booking created: {booking_id}")
    else:
        print(f"Booking Failed: {response.text}")
        return

    # 4. Check-in
    print("Performing Check-in...")
    checkin_data = {"booking_id": booking_id}
    response = requests.post(f"{BASE_URL}/practices/checkin", headers=headers, json=checkin_data)
    
    if response.status_code == 200:
        updated_booking = response.json()
        if updated_booking["status"] == "ATTENDED":
            print("TEST PASSED: Check-in successful, status is ATTENDED.")
        else:
            print(f"TEST FAILED: Status is {updated_booking['status']}")
    else:
        print(f"Check-in Failed: {response.text}")

if __name__ == "__main__":
    test_checkin()
