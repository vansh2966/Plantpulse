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
    train_ds = dataset["train"]
    
    # Get number of classes
    num_classes = train_ds.features["label"].num_classes
    print(f"Found {num_classes} classes in the dataset.")

    # 2. Calculate Alpha Weights (MUST be done before set_transform to avoid OOM)
    alpha_weights = calculate_alpha_weights(dataset["train"], num_classes)
    alpha_weights = alpha_weights.to(device)

    # 3. Setup Image Transforms
    train_transforms = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(15),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    def transform_batch(examples):
        # Convert PIL images to tensors
        examples["pixel_values"] = [train_transforms(image.convert("RGB")) for image in examples["image"]]
        return examples

    train_ds.set_transform(transform_batch)
    
    # Custom collate function since set_transform returns dictionaries
    def collate_fn(batch):
        pixel_values = torch.stack([item["pixel_values"] for item in batch])
        labels = torch.tensor([item["label"] for item in batch])
        return pixel_values, labels

    train_loader = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True, collate_fn=collate_fn)

    # 4. Initialize Model, Loss, Optimizer
    print("Building ConvNeXt-Tiny model with Spatial Attention...")
    # pretrained=True will load ImageNet weights, meaning the backbone is pre-trained
    model = build_model(num_classes=num_classes, pretrained=True)
    model.to(device)

    # Using our Custom Focal Loss
    criterion = FocalLoss(gamma=2.0, alpha=alpha_weights)
    
    # Phase 1: Warmup Optimizer
    # Note: The backbone is frozen inside build_model()
    optimizer = optim.AdamW(model.parameters(), lr=BASE_LR, weight_decay=WEIGHT_DECAY)
    scheduler = None

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

        for batch_idx, (images, labels) in enumerate(train_loader):
            images, labels = images.to(device), labels.to(device)

            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            
            optimizer.step()

            running_loss += loss.item()
            
            if batch_idx % 10 == 0:
                print(f"Epoch [{epoch+1}/{EPOCHS}] Batch [{batch_idx}/{len(train_loader)}] Loss: {loss.item():.4f}")

        # Step the scheduler if in Phase 2
        if scheduler is not None:
            scheduler.step()
            current_lr = scheduler.get_last_lr()[0]
            print(f"Phase 2 Learning Rate updated to: {current_lr:.6f}")

        epoch_loss = running_loss / len(train_loader)
        print(f"Epoch [{epoch+1}/{EPOCHS}] Average Loss: {epoch_loss:.4f}")

    print("Training complete!")
    
    # Save the trained model
    settings.ML_WEIGHTS_PATH.parent.mkdir(parents=True, exist_ok=True)
    
    checkpoint = {
        'model_state_dict': model.state_dict(),
        'num_classes': num_classes
    }
    
    torch.save(checkpoint, settings.ML_WEIGHTS_PATH)
        
    print(f"Model saved to {settings.ML_WEIGHTS_PATH}")

if __name__ == "__main__":
    main()
