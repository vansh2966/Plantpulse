"""
CropAI — Auto Knowledge Base Generator
=======================================
Reads class names from a trained model checkpoint and automatically generates
knowledge_base.json entries for any missing classes.

This eliminates the need to manually write JSON entries every time you train
on a new dataset. Just run this script after training!

Usage:
    python scripts/generate_knowledge.py --checkpoint path/to/model.pt --output path/to/knowledge_base.json
    python scripts/generate_knowledge.py --class-list "Tomato_healthy,Tomato_Early_blight,..."
"""

import json
import re
import argparse
from pathlib import Path
from typing import Optional

# ==========================================
# Disease Category Templates
# ==========================================
# The script classifies each disease name into a category and fills
# the advice template accordingly. No manual work needed!

DISEASE_CATEGORIES = {
    "healthy": {
        "keywords": ["healthy", "normal", "fresh"],
        "status": "healthy",
        "template": {
            "treatment": {
                "chemical": [],
                "organic": [],
                "cultural": []
            },
            "nutrients": {
                "nitrogen": "Maintain balanced nitrogen levels for optimal vegetative growth.",
                "phosphorus": "Ensure adequate phosphorus for strong root development.",
                "potassium": "Provide sufficient potassium for overall plant vigor and disease resistance.",
                "calcium": "Maintain normal calcium levels for healthy cell wall development.",
                "recommendations": "Continue balanced fertilization and regular soil testing to maintain plant health."
            },
            "prevention": [
                "Continue regular monitoring for early signs of disease.",
                "Maintain proper irrigation and drainage.",
                "Practice crop rotation where applicable.",
                "Keep the growing area clean and free of debris."
            ],
            "pruning": {
                "when": "Prune during the dormant season or as needed for shaping.",
                "how": "Remove dead or crossing branches. Always use clean, sharp tools.",
                "frequency": "Annually or as needed for maintenance."
            }
        }
    },
    "fungal": {
        "keywords": [
            "blight", "rot", "mildew", "rust", "scab", "spot", "mold", "mould",
            "wilt", "anthracnose", "septoria", "cercospora", "leaf curl",
            "smut", "canker", "die back", "dieback", "mosaic", "blast",
            "brown spot", "brownspot", "leaf spot", "algal", "esca",
            "measles", "yellow", "sooty"
        ],
        "status": "diseased",
        "template": {
            "treatment": {
                "chemical": [
                    "Apply appropriate registered fungicide (e.g., chlorothalonil, mancozeb, or copper-based).",
                    "Follow label instructions for dosage and reapplication intervals."
                ],
                "organic": [
                    "Remove and destroy affected plant parts immediately.",
                    "Apply neem oil or sulfur-based organic fungicide.",
                    "Improve air circulation around the plant."
                ],
                "cultural": [
                    "Avoid overhead watering to reduce leaf wetness.",
                    "Ensure proper plant spacing for airflow."
                ]
            },
            "nutrients": {
                "nitrogen": "Avoid excess nitrogen, as it promotes tender growth susceptible to fungal infection.",
                "phosphorus": "Maintain balanced phosphorus levels for strong root development.",
                "potassium": "Boost potassium (K) to enhance the plant's natural disease resistance.",
                "calcium": "Ensure adequate calcium for strong cell walls that resist pathogen entry.",
                "recommendations": "Focus on phosphorus and potassium to strengthen the plant's natural defenses while treating the disease."
            },
            "prevention": [
                "Ensure proper spacing between plants for good air circulation.",
                "Avoid overhead watering; water at the base of plants.",
                "Remove and destroy infected plant debris.",
                "Rotate crops annually to break disease cycles.",
                "Use disease-resistant varieties when available."
            ],
            "pruning": {
                "when": "Immediately upon spotting infection symptoms.",
                "how": "Remove infected leaves and branches. Sanitize tools with 70% alcohol between cuts.",
                "frequency": "As needed to control the spread of disease."
            }
        }
    },
    "bacterial": {
        "keywords": [
            "bacterial", "fire blight", "canker", "crown gall",
            "soft rot", "blackleg", "ring rot"
        ],
        "status": "diseased",
        "template": {
            "treatment": {
                "chemical": [
                    "Apply copper-based bactericides early in the season.",
                    "Use streptomycin sprays during bloom if permitted in your region."
                ],
                "organic": [
                    "Prune infected parts aggressively using sterilized tools.",
                    "Apply biological control agents (e.g., Bacillus subtilis)."
                ],
                "cultural": [
                    "Avoid working with plants when they are wet.",
                    "Use disease-free seeds and transplants."
                ]
            },
            "nutrients": {
                "nitrogen": "Reduce nitrogen applications to avoid promoting soft, susceptible growth.",
                "phosphorus": "Maintain balanced phosphorus for strong root systems.",
                "potassium": "Increase potassium to bolster plant immune responses.",
                "calcium": "Ensure sufficient calcium for cell wall integrity.",
                "recommendations": "Shift fertilization emphasis toward potassium and calcium to strengthen plant defenses against bacterial pathogens."
            },
            "prevention": [
                "Avoid working in wet fields to prevent spreading bacteria.",
                "Use disease-free seeds and certified transplants.",
                "Sterilize all tools between plants.",
                "Rotate crops with non-host species for 2-3 years.",
                "Remove volunteer plants and crop debris promptly."
            ],
            "pruning": {
                "when": "Immediately upon spotting infection. Cut at least 12 inches below visible symptoms.",
                "how": "Remove infected branches well below the canker. Sterilize pruning tools between every cut.",
                "frequency": "As needed; inspect regularly during the growing season."
            }
        }
    },
    "viral": {
        "keywords": [
            "virus", "mosaic", "curl", "yellow leaf", "streak",
            "mottle", "ring spot", "stunt"
        ],
        "status": "diseased",
        "template": {
            "treatment": {
                "chemical": [
                    "No direct chemical treatment exists for viral infections.",
                    "Control insect vectors (aphids, whiteflies) with appropriate insecticides."
                ],
                "organic": [
                    "Remove and destroy infected plants immediately to prevent spread.",
                    "Use reflective mulch to deter insect vectors.",
                    "Apply neem oil to control vector populations."
                ],
                "cultural": [
                    "Remove infected plants from the field immediately.",
                    "Control weeds that may harbor the virus."
                ]
            },
            "nutrients": {
                "nitrogen": "Maintain moderate nitrogen levels; avoid stimulating excessive new growth.",
                "phosphorus": "Adequate phosphorus supports root health in stressed plants.",
                "potassium": "Increase potassium to help plants tolerate viral stress.",
                "calcium": "Normal calcium levels help maintain cell structure.",
                "recommendations": "Focus on overall plant health through balanced nutrition. Viral diseases cannot be cured, so prevention is critical."
            },
            "prevention": [
                "Use virus-resistant or tolerant varieties.",
                "Control insect vectors (aphids, whiteflies, thrips) aggressively.",
                "Remove and destroy infected plants promptly.",
                "Use certified virus-free seed and transplant material.",
                "Maintain weed-free borders around fields."
            ],
            "pruning": {
                "when": "Remove entire infected plants immediately upon diagnosis.",
                "how": "Do not prune; remove the whole plant. Bag and destroy it. Do not compost.",
                "frequency": "Inspect regularly; remove infected plants as soon as symptoms appear."
            }
        }
    },
    "pest": {
        "keywords": [
            "aphid", "mite", "spider", "weevil", "beetle",
            "worm", "borer", "thrip", "whitefly", "caterpillar",
            "midge", "hispa", "jassid", "hopper", "fly",
            "bug", "scale", "mealy"
        ],
        "status": "diseased",
        "template": {
            "treatment": {
                "chemical": [
                    "Apply appropriate insecticide or miticide as per label directions.",
                    "Use systemic insecticides for severe infestations."
                ],
                "organic": [
                    "Use insecticidal soap or neem oil sprays.",
                    "Introduce natural predators (ladybugs, lacewings, parasitic wasps).",
                    "Apply diatomaceous earth around the base of affected plants."
                ],
                "cultural": [
                    "Remove heavily infested plant parts.",
                    "Use yellow sticky traps for monitoring and control."
                ]
            },
            "nutrients": {
                "nitrogen": "Avoid excess nitrogen, as it produces soft tissue that attracts pests.",
                "phosphorus": "Maintain balanced phosphorus for strong root systems.",
                "potassium": "Adequate potassium enhances overall plant stress tolerance.",
                "calcium": "Normal calcium levels contribute to stronger cell walls.",
                "recommendations": "Maintain balanced nutrition. Overly lush growth from excess nitrogen can attract more pests."
            },
            "prevention": [
                "Monitor plants regularly for early signs of pest activity.",
                "Maintain healthy soil to promote strong, pest-resistant plants.",
                "Encourage beneficial insects through companion planting.",
                "Remove crop residues after harvest.",
                "Use physical barriers (row covers, netting) when practical."
            ],
            "pruning": {
                "when": "Immediately upon spotting pest damage or colonies.",
                "how": "Remove infested leaves and branches. Dispose of them away from the garden.",
                "frequency": "As needed to control pest populations."
            }
        }
    }
}

def parse_class_name(raw_name: str) -> dict:
    """
    Parse a raw class name like 'Tomato___Early_blight' or 'Early blight (Tomato)'
    into a structured dict with crop and disease.
    """
    # Handle PlantVillage format: "Crop___Disease_Name"
    if "___" in raw_name:
        parts = raw_name.split("___")
        crop = parts[0].replace("_", " ").strip()
        disease = parts[1].replace("_", " ").strip()
        return {"crop": crop, "disease": disease, "raw": raw_name}

    # Handle "Disease (Crop)" format from existing knowledge base
    match = re.match(r'^(.+?)\s*\((.+)\)$', raw_name)
    if match:
        disease = match.group(1).strip()
        crop = match.group(2).strip()
        return {"crop": crop, "disease": disease, "raw": raw_name}

    # Handle simple "Crop Disease" format with underscores
    clean = raw_name.replace("_", " ").strip()
    return {"crop": clean, "disease": clean, "raw": raw_name}


def classify_disease(disease_name: str) -> str:
    """Classify a disease name into a category based on keyword matching."""
    name_lower = disease_name.lower()

    # Check healthy first
    for kw in DISEASE_CATEGORIES["healthy"]["keywords"]:
        if kw in name_lower:
            return "healthy"

    # Check viral before fungal (since "mosaic" could be both)
    for kw in DISEASE_CATEGORIES["viral"]["keywords"]:
        if kw in name_lower:
            return "viral"

    # Check bacterial
    for kw in DISEASE_CATEGORIES["bacterial"]["keywords"]:
        if kw in name_lower:
            return "bacterial"

    # Check pest
    for kw in DISEASE_CATEGORIES["pest"]["keywords"]:
        if kw in name_lower:
            return "pest"

    # Check fungal (most common fallback for plant diseases)
    for kw in DISEASE_CATEGORIES["fungal"]["keywords"]:
        if kw in name_lower:
            return "fungal"

    # Default to fungal as most plant diseases are fungal
    return "fungal"
def make_display_name(parsed: dict) -> str:
    """Create a human-readable display name like 'Early blight (Tomato)'."""
    if parsed["disease"].lower() in ["healthy", "normal", "fresh"]:
        return f"Healthy ({parsed['crop']})"
    return f"{parsed['disease']} ({parsed['crop']})"


def generate_entry(parsed: dict) -> dict:
    """Generate a complete knowledge base entry for a parsed class name."""
    category = classify_disease(parsed["disease"])
    cat_data = DISEASE_CATEGORIES[category]
    template = cat_data["template"]

    if category == "healthy":
        description = "This plant appears healthy. No disease detected."
        symptoms = []
    else:
        description = f"{parsed['disease']} detected on {parsed['crop']}. Please follow the treatment recommendations below."
        symptoms = [f"Visual symptoms of {parsed['disease']} observed on {parsed['crop']} leaves or stems."]

    entry = {
        "crop": parsed["crop"],
        "disease": parsed["disease"],
        "status": cat_data["status"],
        "scientific_name": None,
        "description": description,
        "symptoms": symptoms,
        **template
    }
    return entry


def generate_knowledge_base(
    class_names: list,
    existing_kb_path: Optional[Path] = None,
    output_path: Optional[Path] = None
):
    """
    Main function: takes a list of class names, merges with existing knowledge base,
    auto-generates entries for missing classes, and saves the result.
    """
    # Load existing knowledge base if provided
    existing_kb = {}
    if existing_kb_path and existing_kb_path.exists():
        with open(existing_kb_path, "r", encoding="utf-8") as f:
            existing_kb = json.load(f)
        print(f"Loaded existing knowledge base with {len(existing_kb)} entries.")

    new_count = 0
    kept_count = 0

    for raw_name in class_names:
        parsed = parse_class_name(raw_name)
        display_name = make_display_name(parsed)

        # Check if this class already exists in the knowledge base
        # Try multiple key formats for matching
        found = False
        for key in [raw_name, display_name, parsed["raw"]]:
            if key in existing_kb:
                found = True
                kept_count += 1
                break

        if not found:
            # Auto-generate the entry
            entry = generate_entry(parsed)
            existing_kb[display_name] = entry
            new_count += 1
            category = classify_disease(parsed["disease"])
            print(f"  [NEW] {display_name} (category: {category})")

    # Also add the universal fallback
    if "Unknown Disease" not in existing_kb:
        existing_kb["Unknown Disease"] = {
            "crop": "Unknown",
            "disease": "Unknown",
            "status": "unknown",
            "scientific_name": None,
            "description": "The model could not confidently identify this disease. Please consult a local agricultural expert.",
            "symptoms": [],
            "treatment": {"chemical": [], "organic": [], "cultural": []},
            "nutrients": {
                "nitrogen": "Maintain balanced levels.",
                "phosphorus": "Maintain balanced levels.",
                "potassium": "Maintain balanced levels.",
                "calcium": "Maintain balanced levels.",
                "recommendations": "Consult a local agricultural extension office for diagnosis."
            },
            "prevention": ["Take clear, well-lit photos for better identification.", "Consult a local expert."],
            "pruning": {"when": "Consult an expert.", "how": "Consult an expert.", "frequency": "Consult an expert."}
        }

    # Save
    if output_path is None:
        output_path = Path(__file__).resolve().parent.parent.parent.parent / "CROP" / "knowledge" / "knowledge_base.json"

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(existing_kb, f, indent=4, ensure_ascii=False)

    print(f"\nDone! Knowledge base saved to {output_path}")
    print(f"  Kept existing: {kept_count}")
    print(f"  Auto-generated: {new_count}")
    print(f"  Total entries: {len(existing_kb)}")


def load_class_names_from_checkpoint(checkpoint_path: str) -> list:
    """Extract class names from a PyTorch model checkpoint."""
    import torch
    checkpoint = torch.load(checkpoint_path, map_location="cpu", weights_only=False)
    return checkpoint["class_names"]


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Auto-generate knowledge_base.json from model class names.")
    parser.add_argument("--checkpoint", type=str, help="Path to the trained .pt checkpoint file")
    parser.add_argument("--class-list", type=str, help="Comma-separated list of class names (alternative to --checkpoint)")
    parser.add_argument("--existing", type=str, default=None, help="Path to existing knowledge_base.json to merge with")
    parser.add_argument("--output", type=str, default=None, help="Output path for the new knowledge_base.json")
    args = parser.parse_args()

    if args.checkpoint:
        class_names = load_class_names_from_checkpoint(args.checkpoint)
    elif args.class_list:
        class_names = [c.strip() for c in args.class_list.split(",")]
    else:
        print("Error: Provide either --checkpoint or --class-list")
        exit(1)

    existing_path = Path(args.existing) if args.existing else Path(__file__).resolve().parent.parent.parent.parent / "CROP" / "knowledge" / "knowledge_base.json"
    output_path = Path(args.output) if args.output else existing_path

    print(f"Processing {len(class_names)} classes...")
    generate_knowledge_base(class_names, existing_path, output_path)
