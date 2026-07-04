import argparse
import os
import torch
from torch.utils.data import DataLoader
from torchvision.datasets import ImageFolder
from sklearn.metrics import classification_report, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np

import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from app.config import settings
from app.ml.network import build_model
from app.ml.transforms import get_val_transforms

def main():
    parser = argparse.ArgumentParser(description="Evaluate CropAI Model")
    parser.add_argument("--data-dir", type=str, required=True, help="Path to evaluation dataset (test or val split)")
    parser.add_argument("--weights", type=str, default=str(settings.ML_WEIGHTS_PATH), help="Path to model weights")
    parser.add_argument("--batch-size", type=int, default=32)
    parser.add_argument("--output-dir", type=str, default="./eval_results")
    
    args = parser.parse_args()
    
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")
    
    # Load dataset
    val_transform = get_val_transforms()
    dataset = ImageFolder(args.data_dir, transform=val_transform)
    dataloader = DataLoader(dataset, batch_size=args.batch_size, shuffle=False, num_workers=4)
    
    class_names = dataset.classes
    print(f"Loaded {len(class_names)} classes from dataset.")
    
    # Load model
    print(f"Loading weights from {args.weights}")
    checkpoint = torch.load(args.weights, map_location=device, weights_only=False)
    
    model = build_model(num_classes=len(checkpoint['class_names']), pretrained=False)
    model.load_state_dict(checkpoint['model_state_dict'])
    model.to(device)
    model.eval()
    
    # Check class name match
    if checkpoint['class_names'] != class_names:
        print("Warning: Dataset classes do not match model classes exactly!")
        print(f"Model classes: {len(checkpoint['class_names'])}")
        print(f"Dataset classes: {len(class_names)}")
    
    # Evaluate
    all_preds = []
    all_labels = []
    
    print("Evaluating...")
    with torch.no_grad():
        for inputs, labels in dataloader:
            inputs, labels = inputs.to(device), labels.to(device)
            outputs = model(inputs)
            _, predicted = outputs.max(1)
            
            all_preds.extend(predicted.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())
            
    # Metrics
    print("\n--- Classification Report ---")
    report = classification_report(all_labels, all_preds, target_names=class_names, zero_division=0)
    print(report)
    
    os.makedirs(args.output_dir, exist_ok=True)
    with open(os.path.join(args.output_dir, "classification_report.txt"), "w") as f:
        f.write(report)
        
    # Confusion Matrix
    print("Generating Confusion Matrix...")
    cm = confusion_matrix(all_labels, all_preds)
    plt.figure(figsize=(20, 20))
    sns.heatmap(cm, annot=False, fmt='d', cmap='Blues', xticklabels=class_names, yticklabels=class_names)
    plt.ylabel('True Label')
    plt.xlabel('Predicted Label')
    plt.title('Confusion Matrix')
    plt.xticks(rotation=90)
    plt.tight_layout()
    plt.savefig(os.path.join(args.output_dir, "confusion_matrix.png"), dpi=300)
    print(f"Saved confusion matrix to {os.path.join(args.output_dir, 'confusion_matrix.png')}")

if __name__ == "__main__":
    main()
