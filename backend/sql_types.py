from sqlalchemy.orm import declarative_base
from sqlalchemy import Column, Integer, String
from database import Base

class ServerInstance(Base):
    __tablename__ = "instances"
    
    id = Column(Integer, primary_key=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    
    # configuration
    
    server_directory = Column(String, nullable=True, default=None)
    home_directory = Column(String, nullable=True, default=None)
    screen_name = Column(String, nullable=True, default=None)
    
    java_process = Column(String, nullable=True, default=None)
    java_args_path = Column(String, nullable=True, default=None)
    logs_path = Column(String, nullable=True, default=None)
    start_file = Column(String, nullable=True, default=None)
    