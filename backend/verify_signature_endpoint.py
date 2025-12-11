import requests
import base64
from datetime import date

# Config
BASE_URL = "http://localhost:8000"
USER = "admin"
PASS = "admin123"

# 1. Login
session = requests.Session()
resp = session.post(f"{BASE_URL}/auth/login", data={"username": USER, "password": PASS})
if resp.status_code != 200:
    print(f"Login failed: {resp.text}")
    exit(1)
token = resp.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# 2. Get Course & Enrollment
# We know course exists from previous steps, let's just use the ID if we have it, or fetch.
# Fetching courses to pick one
courses = session.get(f"{BASE_URL}/courses", headers=headers).json()
if not courses:
    print("No courses found")
    exit(1)
course_id = courses[0]["id"]

# Fetch attendance (enrollments)
today = date.today().isoformat()
att = session.get(f"{BASE_URL}/attendance/{course_id}?date={today}", headers=headers).json()
if not att:
    print("No attendance records/students found")
    exit(1)

student_enrollment = att[0]["enrollment_id"]
print(f"Testing with Enrollment ID: {student_enrollment}")

# 3. Upload Signature
dummy_png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
payload = {
    "enrollment_id": student_enrollment,
    "date": today,
    "signature_base64": dummy_png
}

resp = session.post(f"{BASE_URL}/attendance/sign", json=payload, headers=headers)
print(f"Upload Status: {resp.status_code}")
print(f"Response: {resp.text}")

if resp.status_code == 200:
    print("SUCCESS")
else:
    print("FAILURE")
