"""
CropAI — ConvNeXt Model Definition
=======================================
Builds a ConvNeXt-Tiny backbone with a Spatial Attention module and a custom classification head
for crop/disease classification.
"""

import torch
import torch.nn as nn
from torchvision import models
from app.config import settings

class SpatialAttention(nn.Module):
    """
    A lightweight Spatial Attention module using a 1x1 Convolution.
    Generates a 2D attention map highlighting the regions of interest (e.g., leaf lesions).
    """
    def __init__(self, in_channels: int):
        super().__init__()
        self.conv = nn.Conv2d(in_channels, 1, kernel_size=1)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        attention_map = self.sigmoid(self.conv(x))
        return x * attention_map

class CropDiseaseModel(nn.Module):
    def __init__(self, num_classes: int, pretrained: bool = True):
        super().__init__()
        weights = models.ConvNeXt_Tiny_Weights.IMAGENET1K_V1 if pretrained else None
        base_model = models.convnext_tiny(weights=weights)
        
        self.features = base_model.features
        
        # Freeze backbone initially
        for param in self.features.parameters():
            param.requires_grad = False
            
        # ConvNeXt-Tiny outputs 768 channels
        in_features = 768
        
        self.attention = SpatialAttention(in_channels=in_features)
        self.pool = nn.AdaptiveAvgPool2d((1, 1))
        
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.LayerNorm(in_features),
            nn.Dropout(p=0.3),
            nn.Linear(in_features, num_classes)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.features(x)
        x = self.attention(x)
        x = self.pool(x)
        x = self.classifier(x)
        return x

def build_model(num_classes: int, pretrained: bool = True, arch: str = None) -> nn.Module:
    """
    Build ConvNeXt model.
    """
    return CropDiseaseModel(num_classes=num_classes, pretrained=pretrained)

def unfreeze_backbone(model: nn.Module) -> None:
    """
    Unfreeze all backbone (feature extractor) layers for fine-tuning.
    Call this after training the classifier head for a few epochs.
    """
    for param in model.features.parameters():
        param.requires_grad = True

def count_parameters(model: nn.Module) -> dict:
    """Count trainable and total parameters."""
    total = sum(p.numel() for p in model.parameters())
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    return {"total": total, "trainable": trainable, "frozen": total - trainable}
