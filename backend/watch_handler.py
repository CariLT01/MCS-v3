import asyncio
import os
from typing import cast
from watchdog.events import FileSystemEventHandler
from file_event_type import FileEvent, Line

class WatchHandler(FileSystemEventHandler):
    def __init__(self, queue: asyncio.Queue, file_path: str, instance_id: int, loop: asyncio.AbstractEventLoop):
        self.queue = queue
        self.file_path = os.path.abspath(file_path)
        self.dir_path = os.path.dirname(self.file_path)
        self.instance_id = instance_id
        self.loop = loop

        # Determine the number of lines already in the file
        self.line_count = self._count_existing_lines()
        # Start reading from the current end of the file
        self.offset = os.path.getsize(self.file_path)

    def _count_existing_lines(self) -> int:
        """Count how many lines already exist in the file (1‑based)."""
        try:
            with open(self.file_path, "rb") as f:
                content = f.read()
                if not content:
                    return 0
                # Count newline characters; if file doesn't end with a newline,
                # the last incomplete line counts as an extra line.
                count = content.count(b"\n")
                if not content.endswith(b"\n"):
                    count += 1
                return count
        except (OSError, IOError):
            return 0

    def on_modified(self, event):
        if event.is_directory:
            return
        if os.path.abspath(event.src_path) != self.file_path:
            return

        try:
            with open(self.file_path, "r", encoding="utf-8", errors="replace") as f:
                f.seek(self.offset)
                
                lines: list[tuple[int, str]] = []
                
                for line in f:
                    self.line_count += 1
                    lines.append((self.line_count, line.rstrip("\n")))
                if len(lines) > 0:
                    print("NEWS LINE")
                    self.loop.call_soon_threadsafe(
                        self.queue.put_nowait,
                        FileEvent(
                            instance_id=self.instance_id,
                            lines=[{"line": cast(str, l[1]), "number": cast(int, l[0])} for l in lines]
                        )
                    )
                
                self.offset = f.tell()
        except Exception as e:
            print(f"WatchHandler error for {self.file_path}: {e}")