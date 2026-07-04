import sys
import io
# Fix Windows console encoding for emojis printed by PyTorch's ONNX exporter
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

import torch
import onnx
from app.ml.network import build_model
from app.config import settings

def export_to_onnx():
    print(f"Exporting model from {settings.ML_WEIGHTS_PATH} to ONNX...")
    
    if not settings.ML_WEIGHTS_PATH.exists():
        print(f"Error: Weights file not found at {settings.ML_WEIGHTS_PATH}")
        return

    # Load PyTorch Model
    checkpoint = torch.load(settings.ML_WEIGHTS_PATH, map_location="cpu", weights_only=False)
    class_names = checkpoint["class_names"]
    num_classes = len(class_names)

    model = build_model(num_classes=num_classes, pretrained=False)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()

    # Create dummy input based on ConvNeXt-Tiny input size (1, 3, 224, 224)
    dummy_input = torch.randn(1, 3, settings.IMAGE_SIZE, settings.IMAGE_SIZE)

    # Skip overwriting the JSON file so we don't destroy the leaf names mapping
    class_names_path = settings.ML_WEIGHTS_PATH.with_suffix(".json")
    print(f"Skipping JSON extraction. Preserving existing {class_names_path}")

    # Export Path
    onnx_path = settings.ML_WEIGHTS_PATH.with_suffix(".onnx")
    
    # Export
    torch.onnx.export(
        model, 
        dummy_input, 
        onnx_path, 
        export_params=True,
        opset_version=14,
        do_constant_folding=True,
        input_names=['input'],
        output_names=['output'],
        dynamic_axes={'input': {0: 'batch_size'}, 'output': {0: 'batch_size'}}
    )

    print(f"Successfully exported ONNX model to {onnx_path}")
    
    # Verify ONNX model
    onnx_model = onnx.load(onnx_path)
    onnx.checker.check_model(onnx_model)
    print("ONNX model verification passed!")

if __name__ == "__main__":
    export_to_onnx()
