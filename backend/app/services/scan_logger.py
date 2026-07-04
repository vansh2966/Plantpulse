import boto3
from datetime import datetime, timezone
import uuid
from decimal import Decimal
from app.config import settings

class ScanLoggerService:
    def __init__(self):
        self.dynamodb = boto3.resource(
            "dynamodb",
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        )
        self.table_name = settings.DYNAMODB_TABLE_NAME
        self.table = None

    def _get_table(self):
        if not self.table and self.table_name and settings.AWS_ACCESS_KEY_ID:
            self.table = self.dynamodb.Table(self.table_name)
        return self.table

    def log_scan(self, uid: str, prediction_data: dict, image_url: str) -> str:
        """
        Save the prediction result to the user's scan history in DynamoDB.
        Returns the generated scan ID.
        """
        scan_id = uuid.uuid4().hex
        timestamp = datetime.now(timezone.utc).isoformat()
        
        table = self._get_table()
        if not table:
            # Fallback for local development
            return scan_id
            
        try:
            # Convert floats to Decimals for DynamoDB
            confidence = Decimal(str(prediction_data.get("confidence", 0)))
            top_k = [
                {"class_name": item["class_name"], "confidence": Decimal(str(item["confidence"]))}
                for item in prediction_data.get("top_k", [])
            ]
            
            item = {
                "userId": uid,
                "scanId": scan_id,
                "id": scan_id,
                "class_name": prediction_data.get("class_name"),
                "confidence": confidence,
                "top_k": top_k,
                "image_url": image_url,
                "timestamp": timestamp
            }
            
            table.put_item(Item=item)
            return scan_id
        except Exception as e:
            print(f"Error logging scan to DynamoDB: {e}")
            return scan_id

scan_logger_service = ScanLoggerService()
