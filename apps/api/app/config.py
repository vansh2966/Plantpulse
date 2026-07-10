import os
from pydantic_settings import BaseSettings
from pathlib import Path

class Settings(BaseSettings):
    PROJECT_NAME: str = "PlantPulse"
    API_V1_STR: str = "/api/v1"
    
    # Paths
    BASE_DIR: Path = Path(__file__).resolve().parent
    ML_WEIGHTS_PATH: Path = BASE_DIR / "ml" / "weights" / "convnext_tiny_plantdisease.pt"
    
    # Model Config
    MODEL_ARCH: str = "convnext_tiny"
    NUM_CLASSES: int = 94
    CONFIDENCE_THRESHOLD: float = 0.75
    TOP_K: int = 3
    IMAGE_SIZE: int = 224 # 224 for ConvNeXt-Tiny
    IMAGENET_MEAN: tuple = (0.485, 0.456, 0.406)
    IMAGENET_STD: tuple = (0.229, 0.224, 0.225)
    
    # Security
    ALLOWED_ORIGINS: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    # Firebase Auth
    FIREBASE_CREDENTIALS: str = os.getenv("FIREBASE_CREDENTIALS", "")
    
    # AWS (DynamoDB & S3)
    AWS_REGION: str = os.getenv("AWS_REGION", "ap-south-1")
    S3_BUCKET_NAME: str = os.getenv("S3_BUCKET_NAME", "cropai-v2-scans")
    DYNAMODB_TABLE_NAME: str = os.getenv("DYNAMODB_TABLE_NAME", "CropAI_Scans")
    AWS_ACCESS_KEY_ID: str = os.getenv("AWS_ACCESS_KEY_ID", "")
    AWS_SECRET_ACCESS_KEY: str = os.getenv("AWS_SECRET_ACCESS_KEY", "")
    
    # Knowledge Base
    KNOWLEDGE_BASE_PATH: Path = Path(os.getenv("KNOWLEDGE_BASE_PATH", str(BASE_DIR.parent.parent.parent.parent / "CROP" / "knowledge" / "knowledge_base.json")))

    # ML Logging
    WANDB_PROJECT: str = "cropai-v2"
    WANDB_ENABLED: bool = True

    # Sentry
    SENTRY_DSN: str = os.getenv("SENTRY_DSN", "")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
