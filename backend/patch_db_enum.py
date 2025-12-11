
from sqlalchemy import text
from database import engine

def patch_enums():
    # Use autocommit to ensure DDL persists
    with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as connection:
        try:
            print("Adding HEIGHTS_BASIC_CERT...")
            connection.execute(text("ALTER TYPE documenttype ADD VALUE 'HEIGHTS_BASIC_CERT'"))
            print("Success.")
        except Exception as e:
            print(f"info: {e}") 

    with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as connection:
        try:
            print("Adding HEIGHTS_ADVANCED_CERT...")
            connection.execute(text("ALTER TYPE documenttype ADD VALUE 'HEIGHTS_ADVANCED_CERT'"))
            print("Success.")
        except Exception as e:
            print(f"info: {e}")

    with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as connection:
        try:
            print("Adding RESCUE_CERT...")
            connection.execute(text("ALTER TYPE documenttype ADD VALUE 'RESCUE_CERT'"))
            print("Success.")
        except Exception as e:
            print(f"info: {e}")

    print("Enum patch completed.")

if __name__ == "__main__":
    patch_enums()
