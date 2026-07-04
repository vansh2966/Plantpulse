from pydantic import BaseModel
from typing import List, Optional

class PredictionClass(BaseModel):
    class_name: str
    confidence: float

class PredictionResult(BaseModel):
    class_name: str
    display_name: str
    confidence: float
    is_confident: bool
    top_k: List[PredictionClass]

class AdviceTreatment(BaseModel):
    chemical: List[str] = []
    organic: List[str] = []
    cultural: List[str] = []

class AdviceNutrients(BaseModel):
    nitrogen: Optional[str] = None
    phosphorus: Optional[str] = None
    potassium: Optional[str] = None
    calcium: Optional[str] = None
    recommendations: Optional[str] = None

class AdvicePruning(BaseModel):
    when: Optional[str] = None
    how: Optional[str] = None
    frequency: Optional[str] = None

class Advice(BaseModel):
    crop: str
    disease: str
    status: str
    scientific_name: Optional[str] = None
    description: Optional[str] = None
    symptoms: List[str] = []
    treatment: AdviceTreatment = AdviceTreatment()
    nutrients: AdviceNutrients = AdviceNutrients()
    prevention: List[str] = []
    pruning: AdvicePruning = AdvicePruning()

class ScanResult(BaseModel):
    id: str
    image_url: str
    timestamp: str

class PredictResponse(BaseModel):
    prediction: PredictionResult
    advice: Optional[Advice] = None
    scan: Optional[ScanResult] = None
