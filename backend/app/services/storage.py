import boto3
import uuid
from app.config import settings

class StorageService:
    def __init__(self):
        # Initialize the S3 client
        region = settings.AWS_REGION
        endpoint = f"https://s3.{region}.amazonaws.com" if region else None
        
        self.s3_client = boto3.client(
            "s3",
            region_name=region,
            endpoint_url=endpoint,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            config=boto3.session.Config(signature_version='s3v4')
        )
        self.bucket_name = settings.S3_BUCKET_NAME

    def upload_scan_image(self, uid: str, image_bytes: bytes, content_type: str = "image/jpeg") -> str:
        """
        Upload an image to AWS S3 under scans/{uid}/{uuid}.
        Returns a presigned URL of the uploaded image.
        """
        if not self.bucket_name or not settings.AWS_ACCESS_KEY_ID:
            # Fallback for local development
            return "https://via.placeholder.com/224x224.png?text=Local+Storage"

        try:
            file_extension = content_type.split("/")[-1]
            if file_extension == "jpeg":
                file_extension = "jpg"
                
            filename = f"scans/{uid}/{uuid.uuid4().hex}.{file_extension}"
            
            # Upload the file
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=filename,
                Body=image_bytes,
                ContentType=content_type
            )
            
            # Generate a presigned URL (valid for 7 days)
            presigned_url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': self.bucket_name,
                    'Key': filename
                },
                ExpiresIn=604800  # 7 days in seconds
            )
            
            return presigned_url
        except Exception as e:
            print(f"Error uploading image to S3: {e}")
            return ""

storage_service = StorageService()
