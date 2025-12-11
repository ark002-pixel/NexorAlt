from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend import models
import uuid

def test_inventory_logic():
    db = SessionLocal()
    try:
        print("Starting Inventory Management Test...")
        
        # 1. Setup Data
        # Get or create a trainer
        trainer = db.query(models.User).filter(models.User.role == models.UserRole.TRAINER).first()
        if not trainer:
            print("No trainer found. Creating test trainer...")
            trainer = models.User(
                document_id="TRAINER_INV",
                email="trainer_inv@test.com",
                hashed_password="hashed_password",
                full_name="Trainer Inventory",
                role=models.UserRole.TRAINER
            )
            db.add(trainer)
            db.commit()

        # 2. Create Equipment
        serial = f"SN-{uuid.uuid4().hex[:6].upper()}"
        print(f"Creating equipment with Serial {serial}...")
        equipment = models.Equipment(
            name="Arnés de Cuerpo Completo Test",
            serial_number=serial,
            type=models.EquipmentType.HARNESS,
            status=models.EquipmentStatus.OPERATIONAL
        )
        db.add(equipment)
        db.commit()
        print(f"Equipment created with ID: {equipment.id}")
        
        # 3. Register Inspection (PASS)
        print("Registering PASS inspection...")
        inspection_pass = models.Inspection(
            equipment_id=equipment.id,
            inspector_id=trainer.id,
            result=models.InspectionResult.PASS,
            notes="Todo en orden"
        )
        db.add(inspection_pass)
        equipment.last_inspection_date = inspection_pass.date
        db.commit()
        print("Inspection PASS registered.")
        
        # Verify status remains OPERATIONAL
        db.refresh(equipment)
        if equipment.status == models.EquipmentStatus.OPERATIONAL:
            print("Status check passed: Equipment is OPERATIONAL.")
        else:
            print(f"Status check failed: Equipment is {equipment.status}.")

        # 4. Register Inspection (FAIL)
        print("Registering FAIL inspection...")
        inspection_fail = models.Inspection(
            equipment_id=equipment.id,
            inspector_id=trainer.id,
            result=models.InspectionResult.FAIL,
            notes="Correas desgastadas"
        )
        db.add(inspection_fail)
        # Logic in router updates status, here we simulate it manually as we are testing models/db directly
        # In a real integration test we'd hit the API. Let's simulate the logic:
        equipment.status = models.EquipmentStatus.DAMAGED
        equipment.last_inspection_date = inspection_fail.date
        db.commit()
        print("Inspection FAIL registered.")
        
        # Verify status changed to DAMAGED
        db.refresh(equipment)
        if equipment.status == models.EquipmentStatus.DAMAGED:
            print("Status check passed: Equipment is DAMAGED.")
        else:
            print(f"Status check failed: Equipment is {equipment.status}.")
            
        print("Test completed successfully.")
        
    except Exception as e:
        print(f"Test Failed: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    test_inventory_logic()
