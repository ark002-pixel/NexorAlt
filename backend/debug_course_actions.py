import requests
import uuid

BASE_URL = "http://localhost:8000"

def debug():
    # 1. Login as Admin
    print("Logging in...")
    resp = requests.post(f"{BASE_URL}/auth/login", data={"username": "admin_master", "password": "password123"})
    if resp.status_code != 200:
        print(f"Login failed: {resp.text}")
        return
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Get Student for Enrollment tests (Use the one from previous test if exists, or pick one)
    # We'll valid apprentices list first
    print("Fetching apprentices...")
    stud_resp = requests.get(f"{BASE_URL}/auth/apprentices", headers=headers)
    students = stud_resp.json()
    if not students:
        print("No students found. Cannot test enrollment/unenrollment.")
        return
    student_id = students[0]["id"]
    print(f"Using student: {students[0]['full_name']} ({student_id})")

    # 3. Create a Test Course
    print("Creating Test Course...")
    course_data = {
        "name": "Course For Deletion",
        "description": "To be deleted",
        "required_hours": 10,
        "type": "THEORY",
        "price": 50000,
        "start_date": None,
        "location": "Virtual",
        "capacity": 5,
        "required_documents": "[]"
    }
    create_resp = requests.post(f"{BASE_URL}/courses/", json=course_data, headers=headers)
    if create_resp.status_code != 200:
        print(f"Create failed: {create_resp.text}")
        return
    course = create_resp.json()
    course_id = course["id"]
    print(f"Created Course: {course_id}")

    # 4. Enroll Student
    print("Enrolling Student...")
    enroll_data = {"user_id": student_id}
    enroll_resp = requests.post(f"{BASE_URL}/courses/{course_id}/enroll-student", json=enroll_data, headers=headers)
    if enroll_resp.status_code != 200:
        # Check if already enrolled (idempotent)
        if "already enrolled" in enroll_resp.text or enroll_resp.status_code == 409:
            print("Student already enrolled (OK)")
        else:
            print(f"Enroll Failed: {enroll_resp.text}")
    else:
        print("Student Enrolled.")

    # 5. Try to Delete Course (Should FAIL due to enrollment)
    print("Attempting to Delete Course (Should FAIL)...")
    del_resp = requests.delete(f"{BASE_URL}/courses/{course_id}", headers=headers)
    if del_resp.status_code == 400:
        print("SUCCESS: Delete prevented due to active enrollments.")
    elif del_resp.status_code == 200:
        print("FAILURE: Course deleted despite enrollments!")
        return 
    else:
        print(f"Unexpected status deleting course: {del_resp.status_code} {del_resp.text}")

    # 6. Unenroll Student (The feature reported broken)
    print("Attempting to Unenroll Student (Should SUCCEED)...")
    unenroll_resp = requests.delete(f"{BASE_URL}/courses/{course_id}/enrollments/{student_id}", headers=headers)
    if unenroll_resp.status_code == 200:
        print("SUCCESS: Student unenrolled.")
    else:
        print(f"FAILURE: Unenroll failed: {unenroll_resp.status_code} {unenroll_resp.text}")
        return

    # 7. Delete Course (Should SUCCEED now)
    print("Attempting to Delete Course (Should SUCCEED)...")
    del_final_resp = requests.delete(f"{BASE_URL}/courses/{course_id}", headers=headers)
    if del_final_resp.status_code == 200:
        print("SUCCESS: Course deleted.")
    else:
        print(f"FAILURE: Delete failed: {del_final_resp.status_code} {del_final_resp.text}")

if __name__ == "__main__":
    debug()
