from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
import boto3
from boto3.dynamodb.conditions import Key, Attr
from app.middleware.auth import verify_supabase_token
from app.schemas.scan import ScanHistoryResponse, ScanHistoryItem
from app.config import settings
from app.services.knowledge import knowledge_service

router = APIRouter()

def get_dynamodb_table():
    if not settings.AWS_ACCESS_KEY_ID:
        return None
    dynamodb = boto3.resource(
        "dynamodb",
        region_name=settings.AWS_REGION,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    )
    return dynamodb.Table(settings.DYNAMODB_TABLE_NAME)

def decimal_to_float(obj):
    if isinstance(obj, list):
        return [decimal_to_float(i) for i in obj]
    elif isinstance(obj, dict):
        return {k: decimal_to_float(v) for k, v in obj.items()}
    elif type(obj).__name__ == "Decimal":
        return float(obj)
    return obj

@router.get("", response_model=ScanHistoryResponse)
async def get_scan_history(
    limit: int = Query(20, ge=1, le=100, description="Number of scans to return"),
    offset: int = Query(0, ge=0, description="Number of scans to skip"),
    class_name: Optional[str] = Query(None, description="Filter by disease class name"),
    token_data: dict = Depends(verify_supabase_token)
):
    uid = token_data.get("sub")
    if not uid:
        raise HTTPException(status_code=401, detail="User ID not found in token")

    table = get_dynamodb_table()
    if not table:
        return ScanHistoryResponse(scans=[], total=0)

    try:
        # We query the GSI to get items sorted by timestamp
        kwargs = {
            "IndexName": "userId-timestamp-index",
            "KeyConditionExpression": Key("userId").eq(uid),
            "ScanIndexForward": False # Descending order
        }
        
        if class_name:
            kwargs["FilterExpression"] = Attr("class_name").eq(class_name)
            
        # Since DynamoDB query doesn't support offset directly, we fetch all matching items for this user 
        # (user scan history is usually small enough for this). In production with massive history, 
        # we'd use LastEvaluatedKey for pagination.
        response = table.query(**kwargs)
        all_items = response.get("Items", [])
        
        # Handle pagination for results > 1MB if needed
        while "LastEvaluatedKey" in response:
            kwargs["ExclusiveStartKey"] = response["LastEvaluatedKey"]
            response = table.query(**kwargs)
            all_items.extend(response.get("Items", []))
            
        total = len(all_items)
        
        # Apply offset and limit
        paginated_items = all_items[offset : offset + limit]
        
        history = []
        for item in paginated_items:
            # Convert Decimals back to floats
            item = decimal_to_float(item)
            history.append(ScanHistoryItem(**item))
            
        return ScanHistoryResponse(scans=history, total=total)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
async def get_scan_stats(
    token_data: dict = Depends(verify_supabase_token)
):
    """Get aggregate statistics for the user's scans."""
    uid = token_data.get("sub")
    if not uid:
        raise HTTPException(status_code=401, detail="User ID not found in token")

    table = get_dynamodb_table()
    if not table:
        return {"total_scans": 0, "diseases_detected": 0, "avg_confidence": 0, "top_diseases": []}

    try:
        response = table.query(
            KeyConditionExpression=Key("userId").eq(uid)
        )
        items = response.get("Items", [])
        
        while "LastEvaluatedKey" in response:
            response = table.query(
                KeyConditionExpression=Key("userId").eq(uid),
                ExclusiveStartKey=response["LastEvaluatedKey"]
            )
            items.extend(response.get("Items", []))
            
        if not items:
            return {"total_scans": 0, "diseases_detected": 0, "avg_confidence": 0, "top_diseases": []}
            
        total_scans = len(items)
        confidences = []
        disease_counts: dict[str, int] = {}
        
        for item in items:
            conf = float(item.get("confidence", 0))
            confidences.append(conf)
            class_name = item.get("class_name", "unknown")
            disease_counts[class_name] = disease_counts.get(class_name, 0) + 1
        
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0
        diseases_detected = len(disease_counts)
        
        # Top 5 diseases
        sorted_diseases = sorted(disease_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        top_diseases = [
            {"class_name": name, "count": count, "display_name": name.replace("___", " — ").replace("_", " ")}
            for name, count in sorted_diseases
        ]
        
        return {
            "total_scans": total_scans,
            "diseases_detected": diseases_detected,
            "avg_confidence": round(avg_confidence, 3),
            "top_diseases": top_diseases,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{scan_id}")
async def get_scan_by_id(
    scan_id: str,
    token_data: dict = Depends(verify_supabase_token)
):
    """Get a single scan by its ID."""
    uid = token_data.get("sub")
    if not uid:
        raise HTTPException(status_code=401, detail="User ID not found in token")

    table = get_dynamodb_table()
    if not table:
        raise HTTPException(status_code=503, detail="DynamoDB not initialized")

    try:
        response = table.get_item(
            Key={"userId": uid, "scanId": scan_id}
        )
        item = response.get("Item")
        if not item:
            raise HTTPException(status_code=404, detail="Scan not found")
        
        float_item = decimal_to_float(item)
        advice = knowledge_service.get_advice(float_item.get("class_name", ""))
        if advice:
            float_item["advice"] = advice.model_dump() if hasattr(advice, "model_dump") else advice.dict()
        else:
            float_item["advice"] = None
            
        return float_item
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{scan_id}")
async def delete_scan(
    scan_id: str,
    token_data: dict = Depends(verify_supabase_token)
):
    uid = token_data.get("sub")
    if not uid:
        raise HTTPException(status_code=401, detail="User ID not found in token")

    table = get_dynamodb_table()
    if not table:
        raise HTTPException(status_code=503, detail="DynamoDB not initialized")

    try:
        table.delete_item(
            Key={
                "userId": uid,
                "scanId": scan_id
            },
            ConditionExpression="attribute_exists(userId)" # Ensure it exists before deleting, or just delete blindly
        )
        return {"detail": "Scan deleted successfully"}
    except Exception as e:
        # If ConditionExpression fails, it means item doesn't exist
        if e.__class__.__name__ == 'ConditionalCheckFailedException':
            raise HTTPException(status_code=404, detail="Scan not found")
        raise HTTPException(status_code=500, detail=str(e))


