import requests
import time

BASE_URL = "http://localhost:8000"

def test_emergencies():
    # 1. Login as Admin (to see alerts)
    print("Logging in as Admin...")
    admin_doc = "1234567890" # Assuming this user exists from previous tests or seed
    login_data = {"username": admin_doc, "password": "password123"}
    response = requests.post(f"{BASE_URL}/auth/login", data=login_data)
    
    if response.status_code != 200:
        print("Admin login failed. Registering new admin...")
        admin_doc = f"admin_emerg_{int(time.time())}"
        admin_data = {
            "email": f"{admin_doc}@test.com",
            "full_name": "Test Admin Emergencies",
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

    # 2. Create Emergency Alert
    print("Creating Emergency Alert...")
    alert_data = {
        "location": "Torre B - Piso 3",
        "type": "ACCIDENT",
        "description": "Caída de trabajador, posible fractura."
    }
    response = requests.post(f"{BASE_URL}/emergencies/alert", json=alert_data, headers=headers)
    
    if response.status_code == 200:
        print("Alert Created Successfully.")
        alert = response.json()
        print(alert)
        if alert["status"] == "OPEN":
            print("TEST PASSED: Alert status is OPEN.")
        else:
            print("TEST FAILED: Alert status incorrect.")
    else:
        print(f"Alert Creation Failed: {response.text}")
        return

    # 3. List Alerts
    print("Listing Alerts...")
    response = requests.get(f"{BASE_URL}/emergencies/alerts", headers=headers)
    alerts = response.json()
    
    if len(alerts) > 0 and alerts[-1]["location"] == "Torre B - Piso 3":
        print("TEST PASSED: Found created alert.")
    else:
        print("TEST FAILED: Alert not found.")

    # 4. List Rescue Inventory (Empty initially but endpoint should work)
    print("Listing Rescue Inventory...")
    response = requests.get(f"{BASE_URL}/emergencies/rescue-inventory", headers=headers)
    inventory = response.json()
    print(f"Rescue Inventory Count: {len(inventory)}")
    print("TEST PASSED: Rescue inventory endpoint accessible.")

if __name__ == "__main__":
    test_emergencies()
