import os
import time
from process_utils import get_java_pid
from database import SessionLocal
from instances_service import instances_service

class RestartUtils:
    
    def __init__(self):
        self.cache_screen_session_names: dict[int, str] = {}
        self.cache_process_strings: dict[int, str] = {}
        self.cache_server_start_commands: dict[int, str] = {}

    def get_screen_name(self, instance_id: int) -> str:
        if not instance_id in self.cache_screen_session_names:
            # query db
            
            session = SessionLocal()
            try:
                instance_data = instances_service.get_instance(session, instance_id)
            finally:
                session.close()
            if instance_data is None:
                raise ValueError("Instance ID doesn't exist")
            
            self.cache_screen_session_names[instance_id] = str(instance_data.screen_name)
        
        return self.cache_screen_session_names[instance_id]
    
    def get_server_start_string(self, instance_id: int):
        if not instance_id in self.cache_server_start_commands:
            # query db
            
            session = SessionLocal()
            try:
                instance_data = instances_service.get_instance(session, instance_id)
            finally:
                session.close()
            if instance_data is None:
                raise ValueError("Instance ID doesn't exist")
            
            self.cache_server_start_commands[instance_id] = str(instance_data.start_file)
        
        return self.cache_server_start_commands[instance_id]
    
    def get_java_process_string(self, instance_id: int):
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
        
        return self.cache_process_strings[instance_id]
    

    def send_command_to_minecraft(self, instance_id: int, minecraft_command: str):
        if get_java_pid(self.get_java_process_string(instance_id)) is None:

            raise RuntimeError("Cannot send command to Minecraft Server when the minecraft server instance does not exist.")

        screen_session_name = self.get_screen_name(instance_id)

        if screen_session_name == "":
            raise RuntimeError("Empty screen session name")

        exit_code = os.system(f'screen -S "{screen_session_name}" -X stuff "{minecraft_command}\n"')

        if exit_code != 0:
            raise RuntimeError(f"Failed to send command, exit code: {exit_code}")
        else:
            print("Successfully sent command!")
    
    def start_new_server(self, instance_id: int) -> bool:
        
        print("Start server: Starting new server")
        exit_code = os.system(self.get_server_start_string(instance_id))

        if exit_code != 0:
            print(f"Start server: Failed to start new server, exit code: {exit_code}")
            return True

        return False
    
    def restart_server_wrapped(self, instance_id: int) -> bool:

        pid: str|None = get_java_pid(self.get_java_process_string(instance_id))
        if pid == None:
            print("Restart server: No PID Found! Restarting new server")

            server_start_failed = self.start_new_server(instance_id)
            return server_start_failed
        
        screen_session_name = self.get_screen_name(instance_id)

        if screen_session_name == "":
            print("Empty screen session name")
            return True
        
        exit_code = os.system(f'screen -S "{screen_session_name}" -X stuff "/stop\n"')

        if exit_code != 0:
            print(f"Restart server: Failed to stop server, exit code: {exit_code}")
            return True
        print("Restart server: Sent stop signal")

        print("Restart server: Waiting for server shutdown...")
        while get_java_pid(self.get_java_process_string(instance_id)) != None: time.sleep(0.1)
        print("Restart server: Server fully shutdown!")

        server_start_failed = self.start_new_server(instance_id)
        return server_start_failed
    
    def kill_process(self, instance_id: int):
        pid: str | None = get_java_pid(self.get_java_process_string(instance_id))
        if not pid:
            raise RuntimeError("Server is not running")
        
        exit_code = os.system(f"kill -9 {pid}")
        if exit_code != 0:
            raise RuntimeError(f"Killing java process failed with exit code: {exit_code}")
        print(f"Killed: {pid}")
        
    
restart_utils = RestartUtils()