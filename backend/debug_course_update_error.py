import requests
import json
from datetime import datetime

# Get first course and first trainer
try:
    print("Fetching courses...")
    courses = requests.get("http://localhost:8000/courses").json()
    if not courses:
        print("No courses found to update.")
        exit()
    
    target_course = courses[0]
    print(f"Target Course: {target_course['id']} ({target_course['name']})")

    print("Fetching trainers...")
    trainers = requests.get("http://localhost:8000/auth/trainers").json()
    if not trainers:
        print("No trainers found.")
        exit()
        
    target_trainer = trainers[0]
    print(f"Target Trainer: {target_trainer['id']} ({target_trainer['full_name']})")
    print(f"Trainer License Expiration: {target_trainer.get('license_expiration')}")

    # Payload mimicking frontend
    payload = {
        "name": target_course['name'],
        "description": target_course.get('description'),
        "required_hours": target_course['required_hours'],
        "type": target_course['type'],
        "price": target_course['price'],
        "required_documents": target_course.get('required_documents'),
        "start_date": target_course.get('start_date'),
        "location": target_course.get('location'),
        "capacity": target_course['capacity'],
        "trainer_id": target_trainer['id']
    }

    print("Attempting UPDATE...")
    res = requests.put(f"http://localhost:8000/courses/{target_course['id']}", json=payload)
    print(f"Status: {res.status_code}")
    print("Response:", res.text)

except Exception as e:
    print(f"Error: {e}")
