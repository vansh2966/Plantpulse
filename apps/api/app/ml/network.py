"""
PlantPulse — ConvNeXt Model with CBAM Attention
=================================================
Builds a ConvNeXt-Tiny backbone with a CBAM (Convolutional Block Attention Module)
and a deeper classification head for crop/disease classification.

CBAM provides both Channel Attention (WHICH features matter) and
Spatial Attention (WHERE to look), which dramatically improves disease
localization vs the old single 1x1 Conv approach.
"""

import torch
import torch.nn as nn
from torchvision import models
from app.config import settings


class ChannelAttention(nn.Module):
    """
    Squeeze-and-Excitation style channel attention.
    Learns WHICH feature channels are important for disease detection.
    Uses both average-pooling and max-pooling for richer channel statistics.
    """
    def __init__(self, in_channels: int, reduction: int = 16):
        super().__init__()
        mid = max(in_channels // reduction, 1)
        self.avg_pool = nn.AdaptiveAvgPool2d(1)
        self.max_pool = nn.AdaptiveMaxPool2d(1)
        self.fc = nn.Sequential(
            nn.Conv2d(in_channels, mid, 1, bias=False),
            nn.ReLU(inplace=True),
            nn.Conv2d(mid, in_channels, 1, bias=False),
        )
        self.sigmoid = nn.Sigmoid()

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        avg_out = self.fc(self.avg_pool(x))
        max_out = self.fc(self.max_pool(x))
        return x * self.sigmoid(avg_out + max_out)


class SpatialAttention(nn.Module):
    """
    Spatial Attention module using a 7x7 convolution.
    Learns WHERE on the image to focus — critical for highlighting
    diseased leaf regions instead of background/corners.
    """
    def __init__(self, kernel_size: int = 7):
        super().__init__()
        padding = kernel_size // 2
        self.conv = nn.Conv2d(2, 1, kernel_size, padding=padding, bias=False)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        avg_out = torch.mean(x, dim=1, keepdim=True)
        max_out, _ = torch.max(x, dim=1, keepdim=True)
        combined = torch.cat([avg_out, max_out], dim=1)
        attention_map = self.sigmoid(self.conv(combined))
        return x * attention_map


class CBAM(nn.Module):
    """
    CBAM: Convolutional Block Attention Module.
    Combines Channel Attention + Spatial Attention sequentially.
    This replaces the old single 1x1 Conv SpatialAttention that was
    too weak to learn meaningful disease localization patterns.
    """
    def __init__(self, in_channels: int, reduction: int = 16):
        super().__init__()
        self.channel_attention = ChannelAttention(in_channels, reduction)
        self.spatial_attention = SpatialAttention()

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.channel_attention(x)
        x = self.spatial_attention(x)
        return x


class CropDiseaseModel(nn.Module):
    def __init__(self, num_classes: int, pretrained: bool = True):
        super().__init__()
        weights = models.ConvNeXt_Tiny_Weights.IMAGENET1K_V1 if pretrained else None
        base_model = models.convnext_tiny(weights=weights)

        self.features = base_model.features

        # Freeze backbone initially for Phase 1 warmup training
        for param in self.features.parameters():
            param.requires_grad = False

        # ConvNeXt-Tiny outputs 768 channels
        in_features = 768

        # CBAM attention module — replaces old weak 1x1 Conv attention
        self.attention = CBAM(in_channels=in_features)
        self.pool = nn.AdaptiveAvgPool2d((1, 1))

        # Deeper classifier head with hidden layer for better
        # discrimination across 94 classes
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.LayerNorm(in_features),
            nn.Linear(in_features, 512),
            nn.GELU(),
            nn.Dropout(p=0.4),
            nn.Linear(512, num_classes),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.features(x)
        x = self.attention(x)
        x = self.pool(x)
        x = self.classifier(x)
        return x


def build_model(num_classes: int, pretrained: bool = True, arch: str = None) -> nn.Module:
    """
    Build ConvNeXt model with CBAM attention.
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
