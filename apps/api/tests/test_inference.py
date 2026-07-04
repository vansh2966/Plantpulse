import pytest
from app.services.inference import InferenceService

def test_inference_service_singleton():
    """Test that InferenceService is a singleton"""
    service1 = InferenceService()
    service2 = InferenceService()
    assert service1 is service2

def test_inference_service_initialization(mocker):
    """Test service initialization"""
    # Mock torch and network to avoid loading actual model during tests
    mocker.patch("app.services.inference.torch.device")
    mocker.patch("app.services.inference.build_model")
    mocker.patch("app.services.inference.torch.load")
    
    service = InferenceService()
    
    # It might fail to load if file doesn't exist, which sets is_ready to False
    # Or it might succeed if mocked properly. For this test, we just ensure it doesn't crash.
    assert hasattr(service, 'is_ready')
