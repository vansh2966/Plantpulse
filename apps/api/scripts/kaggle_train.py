import os
import torch
import torch.nn as nn
import torch.nn.functional as F
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset
from torchvision import models, transforms
from tqdm import tqdm
import albumentations as A
from albumentations.pytorch import ToTensorV2
import numpy as np

# Make sure to run this in a Kaggle cell first:
# !pip install datasets wandb albumentations huggingface_hub

from datasets import load_dataset
from huggingface_hub import login

# ==========================================
# 0. AUTO-LOGIN (No interactive prompts!)
# ==========================================
# Paste your tokens here and the script runs 100% hands-free overnight.

HF_TOKEN = "YOUR_HUGGINGFACE_TOKEN_HERE"
WANDB_API_KEY = "YOUR_WANDB_API_KEY_HERE"

# Hugging Face login
if HF_TOKEN != "YOUR_HUGGINGFACE_TOKEN_HERE":
    login(token=HF_TOKEN)
else:
    print("Warning: Replace HF_TOKEN with your Hugging Face token!")

# W&B login — fully silent, no prompts
os.environ["WANDB_API_KEY"] = WANDB_API_KEY
os.environ["WANDB_SILENT"] = "true"       # Suppress verbose output
os.environ["WANDB_CONSOLE"] = "off"       # Don't hijack stdout/stderr

import wandb
if WANDB_API_KEY != "YOUR_WANDB_API_KEY_HERE":
    wandb.login(key=WANDB_API_KEY, relogin=True)
else:
    print("Warning: Replace WANDB_API_KEY with your key! W&B logging will be disabled.")

# ==========================================
# 1. Configuration for Kaggle
# ==========================================
USE_WANDB = WANDB_API_KEY != "YOUR_WANDB_API_KEY_HERE"

CONFIG = {
    "model_arch": "convnext_tiny",
    "batch_size": 32,
    "epochs": 15,
    "learning_rate": 1e-4,
    "weight_decay": 1e-2,
    "image_size": 224,  # 224 for ConvNeXt-Tiny
    "imagenet_mean": (0.485, 0.456, 0.406),
    "imagenet_std": (0.229, 0.224, 0.225),
    "hf_dataset_id": "Saon110/bd-crop-vegetable-plant-disease-dataset",
    "weights_save_path": "convnext_tiny_plantdisease.pt",
    "use_wandb": USE_WANDB,
    "wandb_project": "cropai-v2",
}

# ==========================================
# 2. Albumentations Transforms
# ==========================================
class AlbumentationsTransform:
    def __init__(self, transform):
        self.transform = transform

    def __call__(self, img):
        img = np.array(img)
        augmented = self.transform(image=img)
        return augmented['image']

def get_train_transforms():
    transform = A.Compose([
        A.RandomResizedCrop(size=(CONFIG["image_size"], CONFIG["image_size"]), scale=(0.7, 1.0), p=1.0),
        A.HorizontalFlip(p=0.5),
        A.VerticalFlip(p=0.3),
        A.Affine(scale=(0.9, 1.1), translate_percent=(-0.1, 0.1), rotate=(-25, 25), p=0.5),
        A.RandomBrightnessContrast(brightness_limit=0.3, contrast_limit=0.3, p=0.5),
        A.HueSaturationValue(hue_shift_limit=20, sat_shift_limit=30, val_shift_limit=20, p=0.5),
        A.GaussNoise(std_range=(0.012, 0.028), p=0.3),
        A.MotionBlur(blur_limit=5, p=0.2),
        A.ImageCompression(quality_range=(60, 100), p=0.3),
        A.RandomSunFlare(src_radius=100, num_flare_circles_range=(1, 2), p=0.1),
        A.Normalize(mean=CONFIG["imagenet_mean"], std=CONFIG["imagenet_std"]),
        ToTensorV2(),
    ])
    return AlbumentationsTransform(transform)

def get_val_transforms():
    resize_size = int(CONFIG["image_size"] * 1.14)
    return transforms.Compose([
        transforms.Resize(resize_size),
        transforms.CenterCrop(CONFIG["image_size"]),
        transforms.ToTensor(),
        transforms.Normalize(CONFIG["imagenet_mean"], CONFIG["imagenet_std"]),
    ])

# ==========================================
# 3. Custom PyTorch Dataset Wrapper
# ==========================================
class HFDatasetWrapper(Dataset):
    def __init__(self, hf_dataset, transform=None):
        self.hf_dataset = hf_dataset
        self.transform = transform

    def __len__(self):
        return len(self.hf_dataset)

    def __getitem__(self, idx):
        item = self.hf_dataset[idx]
        image = item['image'].convert('RGB')
        label = item['label']
        
        if self.transform:
            image = self.transform(image)
            
        return image, label

# ==========================================
# 4. Model Architecture & Loss (Copied from backend)
# ==========================================
class SpatialAttention(nn.Module):
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
        
        # Unfreeze backbone for end-to-end training
        for param in self.features.parameters():
            param.requires_grad = True
            
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

def build_model(num_classes: int, pretrained: bool = True) -> nn.Module:
    return CropDiseaseModel(num_classes=num_classes, pretrained=pretrained)

class FocalLoss(nn.Module):
    def __init__(self, gamma=2.0, alpha=None, reduction='mean'):
        super(FocalLoss, self).__init__()
        self.gamma = gamma
        self.alpha = alpha  
        self.reduction = reduction

    def forward(self, inputs, targets):
        ce_loss = F.cross_entropy(inputs, targets, reduction='none')
        pt = torch.exp(-ce_loss)
        focal_loss = ((1 - pt) ** self.gamma) * ce_loss
        
        if self.alpha is not None:
            if self.alpha.device != inputs.device:
                self.alpha = self.alpha.to(inputs.device)
            alpha_weights = self.alpha[targets]
            focal_loss = focal_loss * alpha_weights
            
        if self.reduction == 'mean':
            return focal_loss.mean()
        elif self.reduction == 'sum':
            return focal_loss.sum()
        else:
            return focal_loss

# ==========================================
# 5. Training Loop
# ==========================================
def train_model():
    print(f"Loading dataset from Hugging Face: {CONFIG['hf_dataset_id']} ...")
    dataset = load_dataset(CONFIG['hf_dataset_id'])
    
    # If the dataset only has a 'train' split, we need to split it
    if 'validation' not in dataset and 'test' not in dataset:
        print("No validation split found. Creating an 80/20 train/val split...")
        dataset = dataset['train'].train_test_split(test_size=0.2, seed=42)
        train_ds = dataset['train']
        val_ds = dataset['test']
    else:
        train_ds = dataset['train']
        val_ds = dataset.get('validation') or dataset.get('test')
        
    # Extract class names and ensure labels are integers
    if hasattr(train_ds.features['label'], 'names'):
        class_names = train_ds.features['label'].names
    else:
        print("Labels are not integers/ClassLabels. Encoding them automatically...")
        dataset = dataset.class_encode_column('label')
        train_ds = dataset['train']
        val_ds = dataset.get('validation') or dataset.get('test')
        class_names = train_ds.features['label'].names

    num_classes = len(class_names)
    print(f"Detected {num_classes} classes: {class_names}")
    
    # Update config for WandB
    CONFIG['num_classes'] = num_classes
    CONFIG['class_names'] = class_names

    if CONFIG["use_wandb"]:
        wandb.init(project=CONFIG["wandb_project"], config=CONFIG)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Training on device: {device}")

    # Wrap Hugging Face datasets into PyTorch DataLoaders
    train_dataset = HFDatasetWrapper(train_ds, transform=get_train_transforms())
    val_dataset = HFDatasetWrapper(val_ds, transform=get_val_transforms())

    train_loader = DataLoader(train_dataset, batch_size=CONFIG["batch_size"], shuffle=True, num_workers=2, pin_memory=True)
    val_loader = DataLoader(val_dataset, batch_size=CONFIG["batch_size"], shuffle=False, num_workers=2, pin_memory=True)

    # Model, Loss, Optimizer
    model = build_model(num_classes, pretrained=True).to(device)
    criterion = FocalLoss(gamma=2.0)
    optimizer = optim.AdamW(model.parameters(), lr=CONFIG["learning_rate"], weight_decay=CONFIG["weight_decay"])

    best_val_acc = 0.0

    for epoch in range(CONFIG["epochs"]):
        print(f"\nEpoch {epoch+1}/{CONFIG['epochs']}")
        print("-" * 20)

        # Training Phase
        model.train()
        running_loss = 0.0
        running_corrects = 0

        for inputs, labels in tqdm(train_loader, desc="Training"):
            inputs = inputs.to(device)
            labels = labels.to(device)

            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            _, preds = torch.max(outputs, 1)

            loss.backward()
            optimizer.step()

            running_loss += loss.item() * inputs.size(0)
            running_corrects += torch.sum(preds == labels.data)

        train_loss = running_loss / len(train_dataset)
        train_acc = running_corrects.double() / len(train_dataset)

        # Validation Phase
        model.eval()
        val_loss = 0.0
        val_corrects = 0

        with torch.no_grad():
            for inputs, labels in tqdm(val_loader, desc="Validation"):
                inputs = inputs.to(device)
                labels = labels.to(device)

                outputs = model(inputs)
                loss = criterion(outputs, labels)
                _, preds = torch.max(outputs, 1)

                val_loss += loss.item() * inputs.size(0)
                val_corrects += torch.sum(preds == labels.data)

        val_loss = val_loss / len(val_dataset)
        val_acc = val_corrects.double() / len(val_dataset)

        print(f"Train Loss: {train_loss:.4f} Acc: {train_acc:.4f}")
        print(f"Val Loss: {val_loss:.4f} Acc: {val_acc:.4f}")

        if CONFIG["use_wandb"]:
            wandb.log({
                "epoch": epoch + 1,
                "train_loss": train_loss,
                "train_acc": train_acc,
                "val_loss": val_loss,
                "val_acc": val_acc
            })

        # Save Best Model
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            checkpoint = {
                "model_state_dict": model.state_dict(),
                "class_names": class_names,
            }
            torch.save(checkpoint, CONFIG["weights_save_path"])
            print(f"Saved new best model to {CONFIG['weights_save_path']}")

    if CONFIG["use_wandb"]:
        wandb.finish()

if __name__ == "__main__":
    train_model()
