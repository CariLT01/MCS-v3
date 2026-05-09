from typing import TypedDict
import os, traceback
from instances_service import instances_service
from connection_manager import connectionsManager
from subscription_registry import registry
from sql_types import *
from database import *
from server_command_manager import restart_utils
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from fastapi import APIRouter, Depends, WebSocket, HTTPException
from pydantic import BaseModel


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# request types
class InstanceCreationReq(BaseModel):
    name: str

"""

            "server_directory": instance.server_directory,
            "home_directory": instance.home_directory,
            "java_process": instance.java_process,
            "java_args_path": instance.java_args_path,
            "logs_path": instance.logs_path,
            "start_file": instance.start_file
"""


class InstanceConfigureModel(BaseModel):
    server_directory: str
    home_directory: str
    java_process: str
    java_args_path: str
    logs_path: str
    start_file: str
    screen_name: str
    
    instance_id: int

class RestartServerReq(BaseModel):
    instance_id: int

class SendCommandReq(BaseModel):
    instance_id: int
    command: str

# other types

class InstanceSummary(TypedDict):
    name: str
    id: int

class Controller:
    
    def __init__(self):
        self.router = APIRouter(prefix="/api/v1")
        
        
        
        print("hello i am creating a websocket route")
        self.router.add_api_websocket_route(
            "/stream/metrics",
            self.websocket_endpoint
        )
        
        self.router.add_api_route(
            "/instance/create",
            self.create_instance,
            methods=["POST"]
        )
        
        self.router.add_api_route(
            "/instance/get",
            self.get_instances,
            methods=["GET"]
        )
        
        self.router.add_api_route(
            "/logs/load",
            self.get_logs,
            methods=["GET"]
        )
        
        self.router.add_api_route(
            "/instance/get_config",
            self.get_config,
            methods=["GET"]
        )
        
        self.router.add_api_route(
            "/instance/set_config",
            self.set_config,
            methods=["POST"]
        )
        
        self.router.add_api_route(
            "/instance/start",
            self.start_server,
            methods=["POST"]
        )
        
        self.router.add_api_route(
            "/instance/restart",
            self.restart_server,
            methods=["POST"]
        )
        
        self.router.add_api_route(
            "/instance/kill",
            self.kill_server,
            methods=["POST"]
        )
        
        self.router.add_api_route(
            "/instance/stop",
            self.stop_server,
            methods=["POST"]
        )
        
        self.router.add_api_route(
            "/instance/send_command",
            self.send_command,
            methods=["POST"]
        )

    
    def create_instance(self, req: InstanceCreationReq, db: Session = Depends(get_db)):
        new_instance = instances_service.create_instance(db, req.name)
        
        return {
            "id": new_instance.id
        }
    
    async def get_instances(self, db: Session = Depends(get_db)):
        instances = instances_service.get_instances(db)
        
        instances_summarized: list[InstanceSummary] = []
        for instance in instances:
            instances_summarized.append({
                "name": str(instance.name),
                "id": int(instance.id) # type: ignore
            })
        
        return instances_summarized
    
    async def get_config(self, instance_id: int, db: Session = Depends(get_db)):
        instance = instances_service.get_instance(db, instance_id)
        if not instance:
            raise HTTPException(status_code=404, detail="Instance does not exist on the server")
        
        return {
            "server_directory": instance.server_directory,
            "home_directory": instance.home_directory,
            "java_process": instance.java_process,
            "java_args_path": instance.java_args_path,
            "logs_path": instance.logs_path,
            "start_file": instance.start_file,
            "screen_name": instance.screen_name
        }
    
    async def set_config(self, req: InstanceConfigureModel, db: Session = Depends(get_db)):
        
        """
        server_directory = Column(String, nullable=True, default=None)
        home_directory = Column(String, nullable=True, default=None)
        
        java_process = Column(String, nullable=True, default=None)
        java_args_path = Column(String, nullable=True, default=None)
        logs_path = Column(String, nullable=True, default=None)
        start_file = Column(String, nullable=True, default=None)
        """
        
        
        instances_service.update_instance(db, req.instance_id, {
            "server_directory": req.server_directory,
            "home_directory": req.home_directory,
            "java_process": req.java_process,
            "java_args_path": req.java_args_path,
            "logs_path": req.logs_path,
            "start_file": req.start_file,
            "screen_name": req.screen_name
        })
    
    async def websocket_endpoint(self, websocket: WebSocket):
        await connectionsManager.connect(websocket)
        
        try:
            while True:
                msg: dict = await websocket.receive_json()
                
                msg_type = msg.get("type")
                stream = msg.get("stream")
                instance_id = msg.get("instance_id")
                
                key = (stream, instance_id)
                
                if not isinstance(stream, str) or not isinstance(instance_id, int):
                    continue
                
                if msg_type == "subscribe":
                    registry.subscribe(stream, instance_id)
                    registry.client_subscriptions[websocket].add(key)
                elif msg_type == "unsubscribe":
                    registry.unsubscribe(stream, instance_id)
                    registry.client_subscriptions[websocket].discard(key)
                    
        
        finally:
            for stream, instance_id in registry.client_subscriptions.get(websocket, set()):
                registry.unsubscribe(stream, instance_id)

            registry.client_subscriptions.pop(websocket, None)
            
            try:
                connectionsManager.disconnet(websocket)
            except:
                pass
    
    def restart_server(self, req: RestartServerReq):
        success = restart_utils.restart_server_wrapped(req.instance_id)
        if not success:
            raise HTTPException(status_code=500, detail="Restart failed")
    
    def send_command(self, req: SendCommandReq):
        if restart_utils.send_command_to_minecraft(req.instance_id, req.command):
            raise HTTPException(status_code=500, detail="Command failed to send")
    
    def start_server(self, req: RestartServerReq):
        if restart_utils.start_new_server(req.instance_id):
            raise HTTPException(status_code=500, detail="Failed to start")
    
    def stop_server(self, req: RestartServerReq):
        if restart_utils.send_command_to_minecraft(req.instance_id, "/stop"):
            raise HTTPException(status_code=500, detail="Failed to stop server")
    
    def kill_server(self, req: RestartServerReq):
        try:
            restart_utils.kill_process(req.instance_id)
        except Exception as e:
            print(f"Failed to kill: {e}")
            raise HTTPException(status_code=500, detail="Failed to kill the server")
    
    @staticmethod
    def tail(file_path: str, n=1000) -> list[tuple[int, str]]:
        with open(file_path, "rb") as f:
            # First, get total line count efficiently
            f.seek(0)
            total_lines = 0
            for _ in f:
                total_lines += 1
            
            # Reset to read last n lines
            f.seek(0, 2)  # go to end of file
            buffer = bytearray()
            lines = []  # will store (line_number, content)
            lines_found = 0

            while lines_found <= n and f.tell() > 0:
                f.seek(-1, 1)
                byte = f.read(1)
                f.seek(-1, 1)
                if byte == b"\n":
                    # Calculate line number: total_lines - lines_found
                    line_num = total_lines - lines_found
                    content = buffer[::-1].decode("utf-8", errors="ignore")
                    lines.append((line_num, content))
                    buffer = bytearray()
                    lines_found += 1
                else:
                    buffer.extend(byte)

            if buffer:
                line_num = total_lines - lines_found
                content = buffer[::-1].decode("utf-8", errors="ignore")
                lines.append((line_num, content))
                lines_found += 1

            # Return last n lines (lines are currently in reverse order from tail)
            result = lines[-n:] if len(lines) > n else lines
            # Reverse to get chronological order
            return list(reversed(result))
        
        
    def get_logs(self, instance_id: int, db: Session = Depends(get_db)):
        instance_data = instances_service.get_instance(db, instance_id)
        if not instance_data:
            raise HTTPException(status_code=404, detail="Instance ID not found")
        
        log_file_path = str(instance_data.logs_path)
        if not os.path.exists(log_file_path):
            raise HTTPException(status_code=404, detail="File not found on server")
        
        lines = self.tail(log_file_path)
        
        lines_response = []
        for line in lines:
            lines_response.append({"line": line[0], "content": line[1]})
        
        return lines_response
        
        