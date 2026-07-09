from fastapi import APIRouter, File, UploadFile, HTTPException, Depends, Form
from fastapi.responses import StreamingResponse
from io import BytesIO
from urllib.parse import urlparse

from app.services.inference import inference_service
from app.middleware.auth import verify_firebase_token
from app.config import settings

router = APIRouter()

# Domains allowed for image URL fetching — prevents SSRF attacks
ALLOWED_URL_DOMAINS = [
    "s3.amazonaws.com",
    f"s3.{settings.AWS_REGION}.amazonaws.com",
    f"{settings.S3_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com",
    "firebasestorage.googleapis.com",
    "storage.googleapis.com",
]

def _validate_image_url(url: str) -> None:
    """Validate that the image URL points to an allowed domain (SSRF prevention)."""
    parsed = urlparse(url)
    if not parsed.hostname:
        raise HTTPException(status_code=400, detail="Invalid image URL.")
    if not any(parsed.hostname.endswith(domain) for domain in ALLOWED_URL_DOMAINS):
        raise HTTPException(
            status_code=400,
            detail="Image URL domain not allowed. Only S3 and Firebase Storage URLs are accepted."
        )

@router.post("/gradcam")
async def generate_gradcam(
    image: UploadFile = File(None),
    image_url: str = Form(None),
    token_data: dict = Depends(verify_firebase_token)
):
    """
    Generate a Grad-CAM heatmap overlay for the uploaded plant leaf image.
    Returns a PNG image showing which regions the model focused on.
    """
    if not image and not image_url:
        raise HTTPException(status_code=400, detail="Must provide an image file or a valid image_url.")
    
    if image_url == "":
        raise HTTPException(status_code=400, detail="The scan you selected does not have a valid image saved in the database.")

    if not inference_service.is_ready:
        raise HTTPException(
            status_code=503, 
            detail="Model is not loaded. Try again later."
        )

    try:
        if image:
            if not image.content_type or not image.content_type.startswith("image/"):
                raise HTTPException(status_code=400, detail="Must be an image file.")
            contents = await image.read()
        else:
            # Validate URL domain before fetching (SSRF prevention)
            _validate_image_url(image_url)
            import urllib.request
            req = urllib.request.Request(image_url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=10) as response:
                contents = response.read()

        gradcam_bytes = inference_service.generate_gradcam(contents)
        
        return StreamingResponse(
            BytesIO(gradcam_bytes),
            media_type="image/png",
            headers={"Content-Disposition": "inline; filename=gradcam.png"}
        )
    except HTTPException:
        raise
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Grad-CAM generation failed: {str(e)}")
