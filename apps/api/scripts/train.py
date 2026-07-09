import os
import sys
import torch
import torch.optim as optim
from torch.optim.lr_scheduler import CosineAnnealingLR
from pathlib import Path
from collections import Counter
from datasets import load_dataset
from torch.utils.data import DataLoader
from torchvision import transforms


# Add the backend directory to sys.path in a notebook-safe way
try:
    base_dir = Path(__file__).resolve().parent.parent
except NameError:
    # __file__ is not defined in Jupyter notebooks (e.g. Colab/Kaggle)
    base_dir = Path(os.getcwd())
sys.path.append(str(base_dir))

from app.ml.network import build_model, unfreeze_backbone
from app.ml.transforms import get_train_transforms, get_val_transforms
from app.ml.losses import FocalLoss
from app.config import settings

# ---------------------------------------------------------------------------
# CONFIGURATION
# ---------------------------------------------------------------------------
HF_DATASET_NAME = "NAME_OF_YOUR_HF_DATASET" # e.g. "plant-village"
HF_TOKEN = "YOUR_HUGGINGFACE_API_TOKEN"     # Replace with your actual token
BATCH_SIZE = 32
EPOCHS = 10
WARMUP_EPOCHS = 2       # Phase 1: Frozen backbone
BASE_LR = 1e-4          # Phase 1: LR
FINE_TUNE_LR = 1e-5     # Phase 2: Max LR for Cosine Annealing
WEIGHT_DECAY = 1e-2
VAL_SPLIT = 0.2         # Validation split ratio

def calculate_alpha_weights(dataset_split, num_classes):
    """
    Calculates inverse class frequencies to use as alpha weights in Focal Loss.
    """
    print("Calculating class frequencies for Focal Loss alpha weights...")
    labels = dataset_split["label"]
    class_counts = Counter(labels)
    
    # Initialize counts to handle missing classes in the sample safely
    counts = [class_counts.get(i, 1) for i in range(num_classes)] 
    
    total_samples = sum(counts)
    
    # Calculate inverse frequencies
    weights = [total_samples / c for c in counts]
    
    # Normalize weights so they sum to num_classes
    weight_sum = sum(weights)
    normalized_weights = [w * (num_classes / weight_sum) for w in weights]
    
    alpha_tensor = torch.tensor(normalized_weights, dtype=torch.float32)
    print(f"Alpha Weights Tensor: {alpha_tensor}")
    return alpha_tensor

def main():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    # 1. Load Hugging Face Dataset
    print(f"Loading dataset {HF_DATASET_NAME} from Hugging Face...")
    dataset = load_dataset(HF_DATASET_NAME, token=HF_TOKEN)
    
    # Create train/val split if no validation split exists
    if 'validation' not in dataset and 'test' not in dataset:
        print(f"No validation split found. Creating {int((1-VAL_SPLIT)*100)}/{int(VAL_SPLIT*100)} train/val split...")
        dataset = dataset['train'].train_test_split(test_size=VAL_SPLIT, seed=42)
        train_ds = dataset['train']
        val_ds = dataset['test']
    else:
        train_ds = dataset['train']
        val_ds = dataset.get('validation') or dataset.get('test')
    
    # Get class names and number of classes
    if hasattr(train_ds.features['label'], 'names'):
        class_names = train_ds.features['label'].names
    else:
        dataset = dataset.class_encode_column('label')
        train_ds = dataset['train']
        val_ds = dataset.get('test') or dataset.get('validation')
        class_names = train_ds.features['label'].names
        
    num_classes = len(class_names)
    print(f"Found {num_classes} classes in the dataset.")
    print(f"Train size: {len(train_ds)}, Val size: {len(val_ds)}")

    # 2. Calculate Alpha Weights (MUST be done before set_transform to avoid OOM)
    alpha_weights = calculate_alpha_weights(train_ds, num_classes)
    alpha_weights = alpha_weights.to(device)

    # 3. Setup Image Transforms — use the advanced Albumentations pipeline
    # instead of basic torchvision transforms
    import numpy as np
    train_augmentations = get_train_transforms()
    val_augmentations = get_val_transforms()

    def train_transform_batch(examples):
        examples["pixel_values"] = [train_augmentations(image.convert("RGB")) for image in examples["image"]]
        return examples

    def val_transform_batch(examples):
        examples["pixel_values"] = [val_augmentations(image.convert("RGB")) for image in examples["image"]]
        return examples

    train_ds.set_transform(train_transform_batch)
    val_ds.set_transform(val_transform_batch)
    
    # Custom collate function since set_transform returns dictionaries
    def collate_fn(batch):
        pixel_values = torch.stack([item["pixel_values"] for item in batch])
        labels = torch.tensor([item["label"] for item in batch])
        return pixel_values, labels

    train_loader = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True, collate_fn=collate_fn)
    val_loader = DataLoader(val_ds, batch_size=BATCH_SIZE, shuffle=False, collate_fn=collate_fn)

    # 4. Initialize Model, Loss, Optimizer
    print("Building ConvNeXt-Tiny model with CBAM Attention...")
    # pretrained=True will load ImageNet weights, meaning the backbone is pre-trained
    model = build_model(num_classes=num_classes, pretrained=True)
    model.to(device)

    # Using our Custom Focal Loss
    criterion = FocalLoss(gamma=2.0, alpha=alpha_weights)
    
    # Phase 1: Warmup Optimizer
    # Note: The backbone is frozen inside build_model()
    optimizer = optim.AdamW(model.parameters(), lr=BASE_LR, weight_decay=WEIGHT_DECAY)
    scheduler = None
    best_val_acc = 0.0

    # 5. Training Loop
    print("Starting training loop...")
    for epoch in range(EPOCHS):
        
        # Phase 2 Transition
        if epoch == WARMUP_EPOCHS:
            print("\n--- Entering Phase 2: Unfreezing backbone for fine-tuning ---")
            unfreeze_backbone(model)
            
            # Update learning rate down to 1e-5 for fine-tuning
            for param_group in optimizer.param_groups:
                param_group['lr'] = FINE_TUNE_LR
                
            # Initialize Cosine Annealing Scheduler for remaining epochs
            scheduler = CosineAnnealingLR(optimizer, T_max=(EPOCHS - WARMUP_EPOCHS))

        model.train()
        running_loss = 0.0
        running_corrects = 0
        total_samples = 0

        for batch_idx, (images, labels) in enumerate(train_loader):
            images, labels = images.to(device), labels.to(device)

            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            
            # Gradient clipping to prevent explosion
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            
            optimizer.step()

            running_loss += loss.item()
            _, preds = torch.max(outputs, 1)
            running_corrects += (preds == labels).sum().item()
            total_samples += labels.size(0)
            
            if batch_idx % 10 == 0:
                print(f"Epoch [{epoch+1}/{EPOCHS}] Batch [{batch_idx}/{len(train_loader)}] Loss: {loss.item():.4f}")

        # Step the scheduler if in Phase 2
        if scheduler is not None:
            scheduler.step()
            current_lr = scheduler.get_last_lr()[0]
            print(f"Phase 2 Learning Rate updated to: {current_lr:.6f}")

        epoch_loss = running_loss / len(train_loader)
        train_acc = running_corrects / total_samples
        print(f"Epoch [{epoch+1}/{EPOCHS}] Train Loss: {epoch_loss:.4f} Train Acc: {train_acc:.4f}")

        # Validation phase
        model.eval()
        val_loss = 0.0
        val_corrects = 0
        val_total = 0

        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(device), labels.to(device)
                outputs = model(images)
                loss = criterion(outputs, labels)
                val_loss += loss.item()
                _, preds = torch.max(outputs, 1)
                val_corrects += (preds == labels).sum().item()
                val_total += labels.size(0)

        val_epoch_loss = val_loss / len(val_loader) if len(val_loader) > 0 else 0
        val_acc = val_corrects / val_total if val_total > 0 else 0
        print(f"Epoch [{epoch+1}/{EPOCHS}] Val Loss: {val_epoch_loss:.4f} Val Acc: {val_acc:.4f}")

        # Save best model based on validation accuracy
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            settings.ML_WEIGHTS_PATH.parent.mkdir(parents=True, exist_ok=True)
            
            checkpoint = {
                'model_state_dict': model.state_dict(),
                'class_names': class_names,  # FIX: was 'num_classes' — inference.py expects 'class_names'
            }
            torch.save(checkpoint, settings.ML_WEIGHTS_PATH)
            print(f"New best model saved! Val Acc: {val_acc:.4f} -> {settings.ML_WEIGHTS_PATH}")

    print(f"\nTraining complete! Best Val Acc: {best_val_acc:.4f}")
    print(f"Model saved to {settings.ML_WEIGHTS_PATH}")

if __name__ == "__main__":
    main()
