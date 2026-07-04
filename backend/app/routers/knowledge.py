from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from app.services.knowledge import knowledge_service

router = APIRouter()

@router.get("/crops", response_model=List[str])
async def get_all_classes():
    return list(knowledge_service._data.keys())

@router.get("/crops/{class_name}", response_model=Dict[str, Any])
async def get_crop_advice(class_name: str):
    advice = knowledge_service.get_advice(class_name)
    if not advice:
        raise HTTPException(status_code=404, detail="Class not found in knowledge base.")
    return advice.dict()
