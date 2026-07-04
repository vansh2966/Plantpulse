"""
CropAI — Image Transforms
==========================
Training augmentations and validation/inference transforms.
All transforms use ImageNet normalization statistics.
"""

import numpy as np
from torchvision import transforms
import albumentations as A
from albumentations.pytorch import ToTensorV2
from app.config import settings

class AlbumentationsTransform:
    def __init__(self, transform):
        self.transform = transform

    def __call__(self, img):
        # Convert PIL Image to numpy array (H, W, C)
        img = np.array(img)
        augmented = self.transform(image=img)
        return augmented['image']

def get_train_transforms():
    """
    Aggressive augmentation for training to combat PlantVillage domain gap.
    Uses Albumentations for advanced real-world noise simulation.
    """
    transform = A.Compose([
        A.RandomResizedCrop(size=(settings.IMAGE_SIZE, settings.IMAGE_SIZE), scale=(0.7, 1.0), p=1.0),
        A.HorizontalFlip(p=0.5),
        A.VerticalFlip(p=0.3),
        A.Affine(scale=(0.9, 1.1), translate_percent=(-0.1, 0.1), rotate=(-25, 25), p=0.5),
        A.RandomBrightnessContrast(brightness_limit=0.3, contrast_limit=0.3, p=0.5),
        A.HueSaturationValue(hue_shift_limit=20, sat_shift_limit=30, val_shift_limit=20, p=0.5),
        A.GaussNoise(std_range=(0.012, 0.028), p=0.3),
        A.MotionBlur(blur_limit=5, p=0.2),
        A.ImageCompression(quality_range=(60, 100), p=0.3),
        A.RandomSunFlare(src_radius=100, num_flare_circles_range=(1, 2), p=0.1),
        A.Normalize(mean=settings.IMAGENET_MEAN, std=settings.IMAGENET_STD),
        ToTensorV2(),
    ])
    return AlbumentationsTransform(transform)


def get_val_transforms() -> transforms.Compose:
    """
    Deterministic transforms for validation and inference.

    Resize slightly larger then center-crop to target size.
    """
    resize_size = int(settings.IMAGE_SIZE * 1.14) # ~256 for 224
    return transforms.Compose([
        transforms.Resize(resize_size),
        transforms.CenterCrop(settings.IMAGE_SIZE),
        transforms.ToTensor(),
        transforms.Normalize(settings.IMAGENET_MEAN, settings.IMAGENET_STD),
    ])
