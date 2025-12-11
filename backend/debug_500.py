from fastapi.testclient import TestClient
from main import app
import sys
import traceback

client = TestClient(app)

def debug_request():
    print("Testing GET /courses/...")
    try:
        response = client.get("/courses/")
        print("Status Code:", response.status_code)
        print("Response:", response.text)
    except Exception:
        traceback.print_exc()

if __name__ == "__main__":
    debug_request()
