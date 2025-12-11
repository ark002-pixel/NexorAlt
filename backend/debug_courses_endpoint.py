import requests

try:
    print("Fetching courses...")
    res = requests.get("http://localhost:8000/courses")
    print(f"Status: {res.status_code}")
    if res.status_code == 200:
        print(f"Count: {len(res.json())}")
        print("First course sample:", res.json()[0] if res.json() else "None")
    else:
        print("Error content:", res.text)
except Exception as e:
    print(f"Exception: {e}")
