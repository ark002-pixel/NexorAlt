import sys
import os

print("CWD:", os.getcwd())
print("Sys Path:", sys.path)

try:
    import routers.auth
    print("routers.auth file:", routers.auth.__file__)
    with open(routers.auth.__file__, 'r') as f:
        print("--- Content Start ---")
        print(f.read())
        print("--- Content End ---")
except Exception as e:
    print("Import Error:", e)
