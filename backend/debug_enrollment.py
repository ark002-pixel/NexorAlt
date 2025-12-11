from fastapi.testclient import TestClient
from main import app
import sys
import traceback
import uuid

client = TestClient(app)

# Use valid UUIDs for testing (assuming they don't exist, expects 404 or 500)
COURSE_ID = "550e8400-e29b-41d4-a716-446655440000"
USER_ID = "550e8400-e29b-41d4-a716-446655440001" 

# Note: This requires authentication to work fully, but we want to see if it even reaches logic or crashes on auth/schema
# For simpler debugging, we might need a real user/course. 
# But let's try to hit it and see if we get 401 (good) or 500 (bad setup).

def debug_enroll():
    print(f"Testing POST /courses/{COURSE_ID}/enroll-student...")
    try:
        response = client.post(
            f"/courses/{COURSE_ID}/enroll-student",
            json={"user_id": USER_ID},
            # We skip auth headers for now, probing for reaction
        )
        print("Status Code:", response.status_code)
        print("Response:", response.text)
    except Exception:
        traceback.print_exc()

if __name__ == "__main__":
    debug_enroll()
