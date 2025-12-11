import requests
import json

BASE_URL = "http://localhost:8000"

def debug_create():
    payload = {
        "full_name": "ALEJANDRO GIL",
        "document_id": "999888777",
        "email": "unique_trainer@test.com",
        "role": "TRAINER",
        "password": "password123", # Dummy password
        # Frontend might refer to empty strings for optional fields?
        "phone": "",
        "address": "",
        "city": "",
        "birth_date": None, # Sanitized
        "rh_blood_type": "",
        "gender": "",
        "eps": "",
        "arl": "",
        "emergency_contact_name": "",
        "emergency_contact_phone": ""
    }
    
    # NOTE: The frontend initializes formData with empty strings!
    # If the schema expects Optional[datetime] = None, sending "" (empty string) might cause 422 Validation Error.
    # UserBase schema: birth_date: Optional[datetime] = None
    # Pydantic might not accept "" as None for datetime.
    
    print("Attempting to create user with frontend-like payload...")
    res = requests.post(f"{BASE_URL}/auth/register", json=payload)
    
    print(f"Status: {res.status_code}")
    print(f"Response: {res.text}")
    
    if res.status_code == 422:
        print("Validation Error Detected!")

if __name__ == "__main__":
    debug_create()
