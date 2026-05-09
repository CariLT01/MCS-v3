from typing import Set
from fastapi import WebSocket

class ConnectionsManager:
    def __init__(self):
        self.connections: Set[WebSocket] = set()
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.connections.add(websocket)
    
    def disconnet(self, websocket: WebSocket):
        self.connections.discard(websocket)
    
    async def send_json(self, websocket: WebSocket, message: dict) -> None:
        await websocket.send_json(message)


connectionsManager = ConnectionsManager()