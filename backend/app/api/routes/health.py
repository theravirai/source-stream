from fastapi import APIRouter
from datetime import datetime
import time

router = APIRouter()

start_time = time.time()

@router.get("/health")
def health_check():
    return {
        "status": "ok",
        "uptime_seconds": int(time.time() - start_time),
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
