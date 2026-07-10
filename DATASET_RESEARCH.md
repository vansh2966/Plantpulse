# PlantPulse — Dataset & Architecture Research Findings

This document consolidates all research findings from the technical report "Plant Disease Datasets Search.pdf", the 3-agent chatroom debate, and independent verification. It is intended as a reference for the team when deciding which dataset to adopt and whether to migrate to a Vision-Language Model (VLM) architecture.

---

## Current State of PlantPulse

- Architecture: ConvNeXt-Tiny backbone + CBAM (Channel & Spatial Attention) + MLP classifier head
- Training data: 94-class dataset
- Inference: ONNX Runtime on CPU, sub-100ms latency
- Serving: FastAPI backend, no GPU
- Frontend: React Web + React Native Mobile
- Knowledge base: Static JSON file generated via Gemini API

---

## Dataset Comparison Matrix

The following table summarizes the 7 datasets analyzed in the technical report, sorted by image count.

| Dataset | Images | Crop Species | Disease Classes | Environment | License | Source |
|---------|--------|-------------|----------------|-------------|---------|--------|
| LeafNet 2.0 (LeafMD) | 278,131 | 37 | 197 (144 disease + healthy) | Lab + Field + Hybrid across 9 global regions | CC-BY 4.0 | Hugging Face (`enalis/LeafNet2.0`) |
| Deep-Plant-Disease | 248,578 | 55 | 175 (333 crop-disease compositions) | Balanced lab + field | Open | Zenodo + GitHub |
| PDD271 | 220,592 | Multi-crop | 271 | Lab + field | Restricted (corporate IP) | Partially open |
| LeafNet 1.0 | 186,000 | 22 | 97 (62 disease + healthy) | Farm + lab across 7 countries | Open | Hugging Face + GitHub |
| FloraSyntropy Archive | 178,922 | 35 | 97 | Merged from 13 public repos (2018-2023) | CC-BY 4.0 | PMC + GitHub |
| PlantVillage | 54,305 | 14 | 38 | Lab only (uniform gray backdrops) | Public | GitHub + Kaggle |
| PlantWild v2 | 23,689 | 34 | 115 | In-the-wild only | Open | Hugging Face + Google Drive |
| PlantDoc | 2,598 | 13 | 17-27 | Internet-scraped field images | CC-BY 4.0 | GitHub + Kaggle |

---

## Detailed Dataset Profiles

### LeafNet 2.0 (LeafMD) — Top Recommendation

- URL: https://huggingface.co/datasets/enalis/LeafNet2.0
- Paper: https://www.biorxiv.org/content/10.64898/2026.07.01.735881v2
- Origin: University of Texas at Austin + Korea University
- Download size: ~4.16 GB (parquet format with HF streaming support)
- 278,131 images, 255,855 standardized image-text pairs
- 37 crop species, 197 fine-grained crop-disease classes
- Covers 9 global agricultural regions (tropical, subtropical, temperate)
- Multimodal: expert-curated captions, stage-specific annotations (early vs late), symptom-focused text descriptions
- 13,950 question-answer pairs for Visual Question Answering (VQA)
- Evaluation benchmark: LeafBench 2.0 with label-constrained prompting
- Naming standardized via EPPO Global Database taxonomy
- Published July 2026 (brand new)

### Deep-Plant-Disease

- URL: https://github.com/abelchai/Deep-Plant-Disease-Dataset-Is-All-You-Need-for-Plant-Disease-Identification
- Origin: Pl@ntNet consortium + CIRAD
- Download size: ~75 GB (raw images from Zenodo)
- 248,578 images, 55 crop species, 175 disease classes, 333 unique crop-disease compositions
- Designed for zero-shot compositional generalization (recognizing disease patterns on crops never seen in training)
- Includes botanical taxonomy text descriptions
- Supports CLIP-based contrastive vision-language training
- More established than LeafNet 2.0 in terms of community usage

### PDD271 — NOT Recommended

- URL: https://github.com/liuxindazz/PDD271
- 220,592 images, 271 classes
- Restricted license: belongs to Beijing Puhui Sannong Technology Co. Ltd.
- Only a small sample subset is publicly available
- Cannot serve as a primary training corpus for open-source projects
- Cited frequently in benchmarks but not practically usable

### LeafNet 1.0

- URL: https://huggingface.co/datasets/enalis/LeafBench (predecessor)
- Paper: https://arxiv.org/html/2602.13662v2
- 186,000 images, 22 crop species, 97 classes
- Predecessor to LeafNet 2.0 — superseded
- Still useful as a fallback if LeafNet 2.0 proves too new

### FloraSyntropy Archive

- Paper: https://arxiv.org/html/2508.17653v1
- 178,922 images, 35 species, 97 classes
- Merged from 13 public repositories spanning 2018-2023
- Includes PlantVillage (20,639 samples), PlantVillage V2 (70,000), Cassava (53,303), BananaLSD, and others
- Primary purpose: evaluating federated learning frameworks
- Engineered metadata partitions to simulate local client nodes (regional farms)
- Useful for distributed training research, less so for direct classification training

### PlantVillage — Obsolete Baseline

- 54,305 images, 14 crop species, 38 classes
- Lab-only: individual leaves on uniform gray backdrops
- Models trained on this fail catastrophically in real field conditions
- The report explicitly calls this out: "deep neural network optimization paths easily align with superficial global visual shortcuts, such as the overall shape of the leaf margin or background-color borders, rather than learning the actual visual pathology"
- This is what our current 94-class dataset is likely derived from (with additional sources)

### PlantWild v2

- URL: https://huggingface.co/datasets/uqtwei2/PlantWild
- 23,689 images, 34 plant hosts, 115 categories
- In-the-wild only (multi-viewpoint, variable lighting, complex backgrounds)
- Includes text prompts from Wikipedia and GPT-3.5, verified by human pathologists
- Useful as a supplementary field-condition dataset, too small for primary training

### PlantDoc

- 2,598 images, 13 species, 17-27 classes
- Internet-scraped images captured under unstructured field conditions
- Includes bounding box coordinates for object detection (8,595 labeled individual objects)
- Too small for training, useful for benchmarking in-field model performance

---

## Key Technical Insights from the Report

### Why Lab-Only Training Fails

The report documents a well-known phenomenon: models trained exclusively on controlled lab images (like PlantVillage) learn "visual shortcuts" rather than actual disease features. They focus on leaf shape, background color borders, and overall texture instead of localized lesions. When deployed in real fields, classification performance collapses. This is called "catastrophic generalization decay."

This directly explains the problem PlantPulse was having — the AI focusing on corners and backgrounds instead of the disease. Our current CBAM fix addresses this architecturally, but better training data (with field images) is the more fundamental solution.

### Why Mixed Lab + Field Data Works

The report explains the mechanism:
- Lab images serve as "high-fidelity representation anchors" — they teach the model what pure, unoccluded disease lesions look like
- Field images serve as "domain regularizers" — they force the model to discard spatial heuristics and learn domain-invariant lesion patterns regardless of background noise

This combination fundamentally alters where the model pays attention (verified via Grad-CAM in the cited papers).

### EPPO Taxonomy Standardization

A major practical problem with aggregating datasets: the same disease is labeled differently across sources ("Apple Scab" vs "Venturia inaequalis" vs "scab-frog-eye complex"). LeafNet 2.0 solves this by using an LLM pipeline to map all labels to standardized EPPO Global Database codes. This makes it much cleaner to work with than manually merging datasets.

### PlantWild Provenance Warning

The report warns that community-hosted copies of PlantWild on Hugging Face and GitHub often repackage files with altered annotations. Some versions incorrectly label the controlled lab subset as "PlantWild" and pair it with a separate "FieldPlant" subset. Always verify checksums and licensing before using community-hosted datasets.

---

## Architecture Decision: VLMs vs CNNs

### What VLMs Would Enable
- Disease severity grading (early vs late stage), not just binary classification
- Natural language explanations of diagnoses
- Chat-based diagnostics ("Is this early blight or late blight?")
- Hierarchical taxonomic reasoning (if unsure of species, predict genus/family)
- Zero-shot generalization to unseen crop-disease pairs

### Why VLMs Don't Make Sense for PlantPulse Right Now

| Factor | Current CNN | VLM (e.g. PaliGemma-3B) |
|--------|-------------|------------------------|
| Inference latency | Sub-100ms (ONNX, CPU) | 1-3 seconds (GPU required) |
| Monthly serving cost | ~$0 (CPU) | $200-500+ (GPU instance) |
| Infrastructure | FastAPI + ONNX Runtime | vLLM / Triton + GPU |
| Model size | ~28 MB (ONNX) | ~6-12 GB (quantized) |
| Training compute | 1 Kaggle session | Multi-GPU, days |
| User need | "What is wrong?" (instant) | "Tell me more about..." (chat) |

### The Recommended Middle Ground

Use LeafNet 2.0's multimodal text annotations offline to enrich the static knowledge base. This gives 90% of the VLM benefit (detailed symptom descriptions, disease stage info, pathogen taxonomy) at 0% of the inference cost.

Architect the backend with a `PredictionEngine` interface pattern so a VLM can be plugged in later behind a feature flag — without rewriting the frontend or API contract.

---

## The Report's Three Recommended Paths

The PDF explicitly suggests three implementation strategies depending on the use case:

### Option A: Vision-Language Models (Research/Enterprise)
- Dataset: LeafNet 2.0 (LeafMD)
- Architecture: ViT-L or SigLIP visual encoder + PaliGemma or LLaVA language model
- Use case: Interactive, chat-enabled diagnostics or zero-shot decision support
- Requires: GPU infrastructure, significant training compute
- Not recommended for PlantPulse right now

### Option B: Zero-Shot Generalization (Extensibility)
- Dataset: Deep-Plant-Disease
- Architecture: CL-ViT (Cross-Learning Vision Transformer) or FF-CLIP
- Use case: Recognizing disease patterns on crop species never seen in training
- Requires: Moderate GPU for training, can potentially run on CPU after distillation
- Interesting for future PlantPulse expansion but adds complexity

### Option C: Edge/Mobile Deployment (Our Best Fit)
- Dataset: PlantWild v2 + FloraSyntropy Archive (or LeafNet 2.0 images-only)
- Architecture: MobileNetV3-Small, ConvNeXt-Tiny, or YOLOv11x
- Use case: Smartphones, edge sensors, agricultural drones with no cloud connectivity
- Technique: Knowledge Distillation from a large teacher model
- This aligns perfectly with PlantPulse's current architecture

---

## Actionable Recommendation

### Step 1: Download LeafNet 2.0
```python
# Using Hugging Face datasets library
from datasets import load_dataset
dataset = load_dataset("enalis/LeafNet2.0", streaming=True)
```

### Step 2: Retrain ConvNeXt-Tiny + CBAM
- Use the existing `kaggle_train.py` pipeline
- Update `num_classes` from 94 to 197
- The Albumentations augmentation pipeline we already set up is well-suited for this

### Step 3: Extract Text Annotations for Knowledge Base
- Parse LeafNet 2.0's expert-curated text descriptions from the parquet files
- Feed them into `generate_knowledge.py` to build a richer `knowledge_base.json`
- This replaces the current Gemini-generated advice with expert-written pathology descriptions

### Step 4: Re-export to ONNX and Deploy
- Export the retrained model to ONNX
- Drop it into `apps/api/app/ml/weights/`
- Update the frontend to handle 197 class names

### Step 5 (Optional, Future): Knowledge Distillation
- Train a large ViT-L teacher on the full LeafNet 2.0 multimodal data
- Distill its knowledge into the compact ConvNeXt-Tiny student
- This can boost accuracy without changing serving infrastructure

---

## References

1. LeafNet 2.0 paper: https://www.biorxiv.org/content/10.64898/2026.07.01.735881v2
2. LeafNet 1.0 paper: https://arxiv.org/html/2602.13662v2
3. Deep-Plant-Disease: https://github.com/abelchai/Deep-Plant-Disease-Dataset-Is-All-You-Need-for-Plant-Disease-Identification
4. FloraSyntropy: https://arxiv.org/html/2508.17653v1
5. PlantWild: https://huggingface.co/datasets/uqtwei2/PlantWild
6. PDD271: https://github.com/liuxindazz/PDD271
7. CL-ViT: https://github.com/abelchai/Cross-Learning-Vision-Transformer-CL-ViT
8. PlantAIM: https://github.com/abelchai/PlantAIM
9. Knowledge Distillation for Plant Monitoring: https://arxiv.org/html/2604.27178v2
10. CIRAD Plant Disease Identification: https://www.cirad.fr/en/cirad-news/news/2026/identifying-plant-diseases
