import sql_types
from sqlalchemy import select
from sqlalchemy.orm import Session



class InstancesService:
    
    def create_instance(self, db: Session, name: str):
        
        instance = sql_types.ServerInstance(name=name)
        db.add(instance)
        db.commit()
        db.refresh(instance)
        return instance
    
    def get_instances(self, db: Session):
        
        stmt = select(sql_types.ServerInstance)
        result = db.execute(stmt)
        users = result.scalars().all()
        
        return users
    
    def get_instance(self, db: Session, id: int):
        return db.get(sql_types.ServerInstance, id)

    def update_instance(self, db: Session, id: int, data: dict):
        instance = db.get(sql_types.ServerInstance, id)
        if not instance:
            return None

        allowed_fields = set(sql_types.ServerInstance.__table__.columns.keys())
        allowed_fields.discard("id")

        for key, value in data.items():
            if key in allowed_fields:
                setattr(instance, key, value)

        db.commit()
        db.refresh(instance)
        return instance
    
    
instances_service = InstancesService()