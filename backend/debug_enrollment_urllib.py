import urllib.request
import json
import traceback

def debug_enroll_urllib():
    url = "http://localhost:8000/courses/550e8400-e29b-41d4-a716-446655440000/enroll-student"
    data = {"user_id": "550e8400-e29b-41d4-a716-446655440001"}
    headers = {"Content-Type": "application/json"}
    
    print(f"Testing POST {url} via urllib...")
    try:
        req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers=headers, method='POST')
        with urllib.request.urlopen(req) as f:
            print("Response Code:", f.getcode())
            print("Response:", f.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print(f"HTTP Error: {e.code}")
        print("Body:", e.read().decode('utf-8'))
    except Exception:
        traceback.print_exc()

if __name__ == "__main__":
    debug_enroll_urllib()
