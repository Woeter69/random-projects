import time
from rich.console import Console

console = Console()

lines = [
    ("I wanna da-", 0.06),
    ("I wanna dance in the lights", 0.05),
    ("I wanna ro-", 0.07),
    ("I wanna rock your body", 0.08),
    ("I wanna go", 0.08),
    ("I wanna go for a ride", 0.068),
    ("Hop in the music and", 0.07),
    ("Rock your body", 0.08),
    ("Rock that body", 0.069),
    ("Rock that body", 0.05),
    ("(Rock your body)", 0.03),
    ("Rock that body", 0.049),
    ("come on, come on", 0.035),
    ("Rock that body", 0.08),
]


for text, delay in lines:
    for char in text:
        console.print(f"[gold1]{char}[/gold1]", end="")
        time.sleep(delay)
    console.print()
    time.sleep(delay)