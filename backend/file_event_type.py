from dataclasses import dataclass
from typing import TypedDict

class Line(TypedDict):
    line: str
    number: int


@dataclass
class FileEvent:
    instance_id: int
    lines: list[Line]