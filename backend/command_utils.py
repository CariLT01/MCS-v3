import os
import subprocess
import platform

def execute_command_windows(command: str) -> str:
    try:
        output = subprocess.check_output(command.split(" "), shell=True)
        output = output.decode('utf-8')

        return output.replace("\n", "<br>")
    except subprocess.CalledProcessError as e:
        return str(e.output)

def execute_command_linux(command: str):
    try:
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True
        )
        return (result.stdout + result.stderr).replace("\n", "<br>")
    except Exception as e:
        return str(e)

def execute_command(command:str):
    r=""
    if platform.system() == 'Windows': r=execute_command_windows(command)
    else: r=execute_command_linux(command)
    return r
    