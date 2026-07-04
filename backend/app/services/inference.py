import torch
import torch.nn.functional as F
from PIL import Image
from io import BytesIO
from typing import NamedTuple, List, Tuple
import json
import numpy as np

from app.ml.network import build_model
from app.ml.transforms import get_val_transforms
from app.config import settings

try:
    import onnxruntime as ort
    ORT_AVAILABLE = True
except ImportError:
    ORT_AVAILABLE = False

class InferencePrediction(NamedTuple):
    class_name: str
    confidence: float
    top_k: List[Tuple[str, float]]
    is_confident: bool

class InferenceService:
    def __init__(self):
        self.model_path = settings.ML_WEIGHTS_PATH
        self.onnx_path = self.model_path.with_suffix(".onnx")
        self.json_path = self.model_path.with_suffix(".json")
        self.device = torch.device("cpu")
        self.transforms = get_val_transforms()
        self.model = None
        self.ort_session = None
        self.class_names = []
        self.is_ready = False
        self.use_onnx = False

    def load_model(self):
        if self.is_ready:
            return

        # Try loading ONNX first for fast inference
        if ORT_AVAILABLE and self.onnx_path.exists() and self.json_path.exists():
            try:
                self.ort_session = ort.InferenceSession(str(self.onnx_path), providers=["CPUExecutionProvider"])
                with open(self.json_path, "r") as f:
                    self.class_names = json.load(f)
                self.use_onnx = True
                self.is_ready = True
                print(f"Loaded ONNX model from {self.onnx_path}")
                return
            except Exception as e:
                print(f"Failed to load ONNX model: {e}. Falling back to PyTorch.")
                self.use_onnx = False

        # Fallback to PyTorch
        if not self.model_path.exists():
            print(f"Warning: Model checkpoint not found at {self.model_path}.")
            return

        try:
            checkpoint = torch.load(
                self.model_path,
                map_location=self.device,
                weights_only=False,
            )

            class_names = checkpoint["class_names"]
            num_classes = len(class_names)

            model = build_model(num_classes=num_classes, pretrained=False)
            model.load_state_dict(checkpoint["model_state_dict"])
            model.eval()
            model.to(self.device)

            self.model = model
            self.class_names = class_names
            self.is_ready = True
            self.use_onnx = False
            print(f"Loaded PyTorch model from {self.model_path}")
        except Exception as e:
            print(f"Failed to load PyTorch model from {self.model_path}: {e}")
            self.model = None
            self.is_ready = False

    def load_pytorch_for_gradcam(self):
        """Force load PyTorch model even if ONNX is used (required for Grad-CAM)."""
        if self.model is not None:
            return
        print("Loading PyTorch model specifically for Grad-CAM...")
        checkpoint = torch.load(self.model_path, map_location=self.device, weights_only=False)
        model = build_model(num_classes=len(self.class_names), pretrained=False)
        model.load_state_dict(checkpoint["model_state_dict"])
        
        # Unfreeze backbone so gradients can flow to the target convolutional layer for Grad-CAM
        for param in model.features.parameters():
            param.requires_grad = True
            
        model.eval()
        model.to(self.device)
        self.model = model

    def predict(self, image_bytes: bytes) -> InferencePrediction:
        if not self.is_ready:
            self.load_model()
            
        if not self.is_ready:
            raise RuntimeError(
                "Model is not loaded. Please ensure model weights exist at "
                f"{self.model_path} and restart the server."
            )
            
        image = Image.open(BytesIO(image_bytes)).convert("RGB")
        tensor = self.transforms(image).unsqueeze(0)

        if self.use_onnx and self.ort_session:
            # ONNX Inference
            input_name = self.ort_session.get_inputs()[0].name
            ort_inputs = {input_name: tensor.numpy()}
            ort_outs = self.ort_session.run(None, ort_inputs)
            logits = torch.tensor(ort_outs[0])
        else:
            # PyTorch Inference
            tensor = tensor.to(self.device)
            with torch.no_grad():
                logits = self.model(tensor)
                
        probabilities = F.softmax(logits, dim=1).squeeze()
        top_k_probs, top_k_indices = probabilities.topk(settings.TOP_K)
        top_k = [
            (self.class_names[idx.item()], prob.item())
            for idx, prob in zip(top_k_indices, top_k_probs)
        ]

        best_class = self.class_names[top_k_indices[0].item()]
        best_confidence = top_k_probs[0].item()

        return InferencePrediction(
            class_name=best_class,
            confidence=best_confidence,
            top_k=top_k,
            is_confident=best_confidence >= settings.CONFIDENCE_THRESHOLD,
        )

    def generate_gradcam(self, image_bytes: bytes, target_class_idx: int = None) -> bytes:
        """
        Generate a Grad-CAM heatmap overlay for the given image.
        Returns PNG image bytes of the heatmap overlaid on the original image.
        """
        import cv2

        if not self.is_ready:
            self.load_model()
            
        if not self.is_ready:
            raise RuntimeError("Model is not loaded. Cannot generate Grad-CAM.")
            
        if self.model is None:
            self.load_pytorch_for_gradcam()

        image = Image.open(BytesIO(image_bytes)).convert("RGB")
        original_np = np.array(image)
        tensor = self.transforms(image).unsqueeze(0).to(self.device)

        # Hook into the last convolutional block
        activations = []
        gradients = []

        def forward_hook(module, input, output):
            activations.append(output.detach())

        def backward_hook(module, grad_input, grad_output):
            gradients.append(grad_output[0].detach())

        # The last block of the features sequential is the target layer
        target_layer = self.model.features[-1]
        fwd_handle = target_layer.register_forward_hook(forward_hook)
        bwd_handle = target_layer.register_full_backward_hook(backward_hook)

        # Forward pass
        self.model.eval()
        output = self.model(tensor)
        
        if target_class_idx is None:
            target_class_idx = output.argmax(dim=1).item()

        # Backward pass for the target class
        self.model.zero_grad()
        target_score = output[0, target_class_idx]
        target_score.backward()

        # Remove hooks
        fwd_handle.remove()
        bwd_handle.remove()

        # Compute Grad-CAM
        act = activations[0].squeeze(0)  # (C, H, W)
        grad = gradients[0].squeeze(0)   # (C, H, W)

        weights = grad.mean(dim=(1, 2))  # Global average pooling over spatial dims
        cam = torch.zeros(act.shape[1:], dtype=torch.float32)
        for i, w in enumerate(weights):
            cam += w * act[i]

        cam = F.relu(cam)
        cam = cam - cam.min()
        if cam.max() > 0:
            cam = cam / cam.max()

        # Resize heatmap to original image size
        cam_np = cam.cpu().numpy()
        cam_resized = cv2.resize(cam_np, (original_np.shape[1], original_np.shape[0]))
        heatmap = cv2.applyColorMap(np.uint8(255 * cam_resized), cv2.COLORMAP_JET)
        heatmap = cv2.cvtColor(heatmap, cv2.COLOR_BGR2RGB)

        # Overlay
        overlay = np.uint8(0.5 * original_np + 0.5 * heatmap)

        # Encode to PNG bytes
        overlay_image = Image.fromarray(overlay)
        buf = BytesIO()
        overlay_image.save(buf, format="PNG")
        return buf.getvalue()

# Singleton instance to be used across requests
inference_service = InferenceService()
