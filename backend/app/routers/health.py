from fastapi import APIRouter
from pydantic import BaseModel
from app.services.inference import inference_service

router = APIRouter()

class HealthResponse(BaseModel):
    status: str
    model_ready: bool

@router.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="ok",
        model_loaded=inference_service.model is not None
    )
