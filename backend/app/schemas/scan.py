from pydantic import BaseModel
from typing import List, Optional

class ScanClassInfo(BaseModel):
    class_name: str
    confidence: float

class ScanHistoryItem(BaseModel):
    id: str
    class_name: str
    confidence: float
    top_k: List[ScanClassInfo] = []
    image_url: str
    timestamp: str

class ScanHistoryResponse(BaseModel):
    scans: List[ScanHistoryItem]
    total: int = 0
