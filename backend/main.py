import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from controller import Controller
from metrics_manager import MetricsManager
from logs_manager import LogsManager
import sql_types
from database import Base, engine

metrics = MetricsManager()
logs_manager = LogsManager()

@asynccontextmanager
async def lifespan(app: FastAPI):
    await metrics.start()
    await logs_manager.start()
    
    yield
    
    await metrics.stop()
    await logs_manager.stop()

Base.metadata.create_all(bind=engine)

app = FastAPI(lifespan=lifespan)
controller = Controller()
app.include_router(controller.router)
app.mount(
    "/assets",
    StaticFiles(directory="dist/assets"),
    name="assets"
)

@app.get("/{full_path:path}")
def serve_spa(full_path: str):
    file_path = os.path.join("dist", "index.html")
    return FileResponse(file_path)

print(app.routes)