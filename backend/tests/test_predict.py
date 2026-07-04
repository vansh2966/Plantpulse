import io

def test_predict_endpoint_success(client, sample_image_bytes, mock_inference_service):
    """Test successful image prediction"""
    response = client.post(
        "/api/v1/predict",
        files={"image": ("test.jpg", sample_image_bytes, "image/jpeg")}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "prediction" in data
    assert "advice" in data
    
    # Check prediction matches mock
    assert data["prediction"]["class_name"] == "apple___apple_scab"
    assert data["prediction"]["confidence"] == 0.95
    assert data["prediction"]["disease_name"] == "Apple Scab"

def test_predict_endpoint_invalid_file_type(client):
    """Test prediction with non-image file"""
    response = client.post(
        "/api/v1/predict",
        files={"image": ("test.txt", b"Hello World", "text/plain")}
    )
    
    assert response.status_code == 400
    assert "detail" in response.json()
    assert "Must be an image" in response.json()["detail"]

def test_predict_endpoint_empty_file(client):
    """Test prediction with empty file"""
    response = client.post(
        "/api/v1/predict",
        files={"image": ("empty.jpg", b"", "image/jpeg")}
    )
    
    # Depending on how FastAPI handles empty files (either 400 or 422)
    assert response.status_code in [400, 422]

def test_health_endpoint(client):
    """Test health check endpoint"""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "model_ready" in data
