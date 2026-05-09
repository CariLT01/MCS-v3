from command_utils import execute_command

def get_java_pid(java_process: str):

    """
    Tries to get the PID of the Minecraft server java process
    """

    try:
        lines = execute_command("ps -ef|grep java").split("<br>")
        s = java_process
        pid = None
        for l in lines:
            if s in l:
                pid = l.split()[1]
                print(l.split())
                print(f"PID is: {pid}")
                return pid
    except:
        print("Failed")
        return