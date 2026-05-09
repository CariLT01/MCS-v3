import asyncio
import os
from subscription_registry import registry
from file_event_type import FileEvent
from watch_handler import WatchHandler
from database import SessionLocal
from instances_service import instances_service
from watchdog.observers import Observer
from watchdog.observers.api import BaseObserver
from fastapi import WebSocket

class LogsManager:
    def __init__(self):
        self.task = None
        
        self.cached_log_directories: dict[int, str] = {}
        self.file_changes_queue: asyncio.Queue[FileEvent] = asyncio.Queue()
        self.observers: dict[int, "BaseObserver"] = {}
        
        self.tasks: list = []
    
    async def start_new_job(self, instance_id: int):
        if not instance_id in self.cached_log_directories:
            # query db
            
            session = SessionLocal()
            try:
                instance_data = instances_service.get_instance(session, instance_id)
            finally:
                session.close()
            if instance_data is None:
                raise ValueError("Instance ID doesn't exist")
            
            self.cached_log_directories[instance_id] = str(instance_data.logs_path)
        
        
        file_path = self.cached_log_directories[instance_id]  # make sure this is the actual log file path
        handler = WatchHandler(self.file_changes_queue, file_path, instance_id, asyncio.get_running_loop())
        observer = Observer()
        observer.schedule(handler, path=os.path.dirname(file_path), recursive=False)
        observer.start()
        
        self.observers[instance_id] = observer
        
    
    async def logs_loop(self):

        while True:
            active_instance_IDs: set[int] = set()
            
            for ws, subscriptions in registry.client_subscriptions.items():
                for k in subscriptions:
                    if k[0] != "logs": continue
                    active_instance_IDs.add(k[1])
            
            print(f"active instances: {active_instance_IDs}")
            
            to_delete: set[int] = set()
            
            
            for instance_id, observer in self.observers.items():
                if instance_id not in active_instance_IDs:
                    print(f"Attempting to stop observer for: {instance_id}")
                    observer.stop()
                    observer.join()
                    print(f"Observer for {instance_id} stopped")
                    to_delete.add(instance_id)
            
            for td in to_delete:
                del self.observers[td]
            
            for instance_id in active_instance_IDs:
                if not instance_id in self.observers:
                    print(f"Starting job for task: {instance_id}")
                    await self.start_new_job(instance_id)
                    
            
            await asyncio.sleep(1) 
    
    async def handle_event(self, event: FileEvent):
        print("got event:", event.lines)
        for ws, subscriptions in registry.client_subscriptions.items():
            if ("logs", event.instance_id) not in subscriptions:
                continue
            
            
            
            wss: WebSocket = ws
            await wss.send_json({
                "type": "logs",
                "instance_id": event.instance_id,
                "data": {
                    "lines": event.lines,
                }
            })
    
    async def send_queue_worker(self):
        while True:
            event = await self.file_changes_queue.get()
            await self.handle_event(event)
            self.file_changes_queue.task_done()
    
    async def start(self):
        self.tasks.append(asyncio.create_task(self.send_queue_worker()))
        self.tasks.append(asyncio.create_task(self.logs_loop()))
    
    async def stop(self):
        for task in self.tasks:
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass