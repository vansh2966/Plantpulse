from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from datetime import datetime, timezone
from app.schemas.predict import PredictResponse, PredictionResult, PredictionClass, ScanResult
from app.services.inference import inference_service
from app.services.knowledge import knowledge_service
from app.services.storage import storage_service
from app.services.scan_logger import scan_logger_service
from app.middleware.auth import verify_firebase_token

router = APIRouter()

@router.post("/predict", response_model=PredictResponse)
async def predict_image(
    image: UploadFile = File(...),
    token_data: dict = Depends(verify_firebase_token)
):
    if not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File provided is not an image.")
    
    try:
        contents = await image.read()
        
        # Validate dimensions
        import io
        from PIL import Image, UnidentifiedImageError
        try:
            with Image.open(io.BytesIO(contents)) as img:
                width, height = img.size
                if width < 32 or height < 32:
                    raise HTTPException(status_code=400, detail="Image dimensions too small (min 32x32).")
                if width > 8192 or height > 8192:
                    raise HTTPException(status_code=400, detail="Image dimensions too large (max 8192x8192).")
        except UnidentifiedImageError:
            raise HTTPException(status_code=400, detail="Invalid image file format.")
            
        # Run inference
        prediction = inference_service.predict(contents)
        
        # Fetch knowledge advice
        advice = knowledge_service.get_advice(prediction.class_name)
        
        display_name = prediction.class_name.replace("___", " — ").replace("_", " ")
        
        result = PredictionResult(
            class_name=prediction.class_name,
            display_name=display_name,
            confidence=prediction.confidence,
            is_confident=prediction.is_confident,
            top_k=[PredictionClass(class_name=c, confidence=p) for c, p in prediction.top_k]
        )
        
        # Upload image to Firebase Storage
        uid = token_data.get("uid")
        image_url = storage_service.upload_scan_image(uid, contents, image.content_type)
        
        # Log scan to Firestore
        prediction_data = {
            "class_name": prediction.class_name,
            "confidence": prediction.confidence,
            "top_k": [{"class_name": c, "confidence": p} for c, p in prediction.top_k]
        }
        scan_id = scan_logger_service.log_scan(uid, prediction_data, image_url)
        
        return PredictResponse(
            prediction=result,
            advice=advice,
            scan=ScanResult(
                id=scan_id,
                image_url=image_url,
                timestamp=datetime.now(timezone.utc).isoformat()
            )
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
