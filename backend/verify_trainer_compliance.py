import requests

def login_admin():
    url = "http://localhost:8000/token"
    # Assuming default admin credentials from seed.py or similar
    # Using the standard debugging credentials
    payload = {"username": "1234567890", "password": "adminpassword"} 
    try:
        res = requests.post(url, data=payload)
        return res.json().get("access_token")
    except:
        return None

def check_trainers():
    token = login_admin()
    if not token:
        print("Could not login as admin.")
        return

    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        print("Fetching trainers...")
        res = requests.get("http://localhost:8000/auth/trainers", headers=headers)
        if res.status_code != 200:
            print(f"Error fetching trainers: {res.status_code} {res.text}")
            return
            
        trainers = res.json()
        print(f"Found {len(trainers)} trainers.")
        
        for t in trainers:
            print(f"Trainer: {t['full_name']} (ID: {t['document_id']})")
            print(f"  - License Expiration: {t.get('license_expiration')}")
            if not t.get('license_expiration'):
                print("  -> WARNING: No license date set. Cannot be assigned to courses.")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_trainers()
