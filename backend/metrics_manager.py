import time
from typing import TypedDict, Literal, cast
import asyncio
import re
from instances_service import instances_service
from command_utils import execute_command
from database import SessionLocal
from process_utils import get_java_pid
from subscription_registry import registry
import psutil
from fastapi import WebSocket

class ProcessMetrics(TypedDict):
    exists: bool
    total_memory: float
    memory_used_bytes: int
    cpu_usage: float
    instance_id: int
    
class ProcessSample(TypedDict):
    sample_type: Literal["instance", "system"]
    instance_id: int | None
    

class MetricsManager:
    def __init__(self):
        
        self.running = False
        self.task = None
        
        self.cache_process_strings: dict[int, str] = {}
        self.cache_jvm_args_paths: dict[int, str] = {}
        
    @staticmethod
    def get_memory_usage_pid(pid: int) -> int | None:
        try:
            process = psutil.Process(pid)
            memory_info = process.memory_info()
            
            return memory_info.rss
        except psutil.NoSuchProcess as e:
            print(f"Process PID: {pid} does not exist: {e}")
            return None
        
    @staticmethod
    def get_cpu_usage(pid: int) -> float | None:
        try:
            process = psutil.Process(pid)
            cpu_usage = process.cpu_percent(interval=1)
            return cpu_usage
        except psutil.NoSuchProcess:
            print(f"Process PID: {pid} does not exist")
            return None
        except psutil.AccessDenied:
            print(f"Process PID: {pid} cpu usage read access denied")
            return None
    
    @staticmethod
    def parse_memory_value(value: str) -> float:
        # Extract the numeric part and unit (M or G)
        match = re.match(r'(\d+\.?\d*)([MG])', value)
        if not match:
            raise ValueError("Invalid memory value format")

        # Get numeric part and unit
        number_str, unit = match.groups()
        number = float(number_str)

        # Convert to GB
        if unit == 'G':
            return number
        elif unit == 'M':
            return number / 1024
        else:
            raise ValueError("Invalid memory unit")
    
    @staticmethod
    def get_xmx_value(input_str: str) -> float | None:
        lines = input_str.splitlines()
        cleaned_lines = [line for line in lines if not line.strip().startswith("#")]
        cleaned_string = "\n".join(cleaned_lines)
        
        xmx_pattern = re.compile(r'-Xmx(\d+\.?\d*[MG])')
        match = xmx_pattern.search(cleaned_string)
        
        if match:
            xmx_value = match.group(1)
            #print(f"xmx value: {xmx_value}")
            return MetricsManager.parse_memory_value(xmx_value)
        else:
            print(f"No match in: {cleaned_string}")
            return None
        
    @staticmethod
    def get_process_memory_total(jvm_args_path: str):
        try:
            with open(jvm_args_path, "r", encoding="utf-8") as f:
                content = f.read()
            
            return MetricsManager.get_xmx_value(content) or 0
                
        except FileNotFoundError:
            print(f"File doesn't exist: {jvm_args_path}")
            return 0
        except ValueError:
            print("Invalid unit in JVM args file")
            return 0
        
    def sample_instance(self, instance: ProcessSample):
        
        metrics: ProcessMetrics = {
            "cpu_usage": 0,
            "exists": False,
            "memory_used_bytes": 0,
            "total_memory": 0,
            "instance_id": -1
        }
        
        #print("Sample: ", instance)
        
        if instance["instance_id"] is not None and instance["instance_id"] != -1:
            instance_id = instance["instance_id"]
            metrics["instance_id"] = instance_id
            if not instance_id in self.cache_process_strings:
                # query db
                
                session = SessionLocal()
                try:
                    instance_data = instances_service.get_instance(session, instance_id)
                finally:
                    session.close()
                if instance_data is None:
                    raise ValueError("Instance ID doesn't exist")
                
                self.cache_process_strings[instance_id] = str(instance_data.java_process)
            
            processes_output = execute_command("ps -ef")
            if self.cache_process_strings[instance_id] in processes_output:
                metrics["exists"] = True
            
            pid = get_java_pid(self.cache_process_strings[instance_id])
            
            if pid is not None:
                pid = int(pid)
                metrics["memory_used_bytes"] = self.get_memory_usage_pid(pid) or 0
                metrics["cpu_usage"] = self.get_cpu_usage(pid) or 0
            else:
                print("Server PID not found")
            
            if not instance_id in self.cache_jvm_args_paths:
                # query db
                
                session = SessionLocal()
                try:
                    instance_data = instances_service.get_instance(session, instance_id)
                finally:
                    session.close()
                if instance_data is None:
                    raise ValueError("Instance ID doesn't exist")
                
                self.cache_jvm_args_paths[instance_id] = str(instance_data.java_args_path)
            
            metrics["total_memory"] = self.get_process_memory_total(self.cache_jvm_args_paths[instance_id]) or 0
            
            return metrics
        else:
            cpu_perc = psutil.cpu_percent(interval=1)
            mem = psutil.virtual_memory()
            total = mem.total
            used = mem.used
            
            metrics["cpu_usage"] = cpu_perc
            metrics["memory_used_bytes"] = used
            metrics["total_memory"] = total
            
            #print(f"metrics: {metrics}")
            
            return metrics
            
    
    async def sample_all(self, instance_ids: list[int]) -> list[ProcessMetrics]:
        loop = asyncio.get_running_loop()
        
        tasks = [
            loop.run_in_executor(None, self.sample_instance, cast(ProcessSample, {"instance_id": iid, "sample_type": "instance"}))
            for iid in instance_ids
        ]
        
        tasks += [
            loop.run_in_executor(None, self.sample_instance, cast(ProcessSample, {"instance_id": None, "sample_type": "system"}))
        ]
        
        # print("Run tasks: ", tasks)
        
        return await asyncio.gather(*tasks)

    async def metrics_loop(self):
        while True:
            start = time.time()
            
            instance_Ids = []
            for ws, setkeys in registry.client_subscriptions.items():
                for k in setkeys:
                    if k[0] != "metrics" and k[0] != "system_metrics": continue
                    instance_Ids.append(k[1])
            
            instance_Ids = list(set(instance_Ids))
            
            #print(instance_Ids)
            
            cpu_usage_sys = 0
            mem_sys = 0
            mem_total_sys = 0
        
            #print("sample")
            results = await self.sample_all(instance_Ids)
            #print("stop sampling")

            for result in results:

                instance_id = result["instance_id"]
                if instance_id is None or instance_id == -1:
                    #print("detected none system")
                    cpu_usage_sys = result["cpu_usage"]
                    mem_sys = result["memory_used_bytes"]
                    mem_total_sys = result["total_memory"]
                    continue
                
                message = {
                    "type": "metrics",
                    "instance_id": instance_id,
                    "data": result
                }
                
                for ws, subscriptions in registry.client_subscriptions.items():
                    if ("metrics", instance_id) not in subscriptions:
                        continue
                    
                    wss: WebSocket = ws
                    await wss.send_json(message)
            
            # system metrics
            swap = psutil.swap_memory()
            swap_total = swap.total
            swap_used = swap.used
            
            message = {
                "type": "system_metrics",
                "data": {
                    "swap_used": swap_used,
                    "swap_total": swap_total,
                    "cpu": cpu_usage_sys,
                    "mem_used": mem_sys,
                    "mem_total": mem_total_sys
                }
            }
            
            for ws, subscriptions in registry.client_subscriptions.items():
                if ("system_metrics", -1) not in subscriptions:
                    continue
                
                wss: WebSocket = ws
                await wss.send_json(message)
            
            # sleep remaining time
            
            elapsed = time.time() - start
            await asyncio.sleep(max(0, 1 - elapsed))
        print("stop running")
    
    async def start(self):
        self.running = True
        self.task = asyncio.create_task(self.metrics_loop())
    
    async def stop(self):
        self.running = False
        if self.task:
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass
    
    