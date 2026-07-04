# PlantPlus (formerly CropAI v2) - Project Status & Handoff Summary

**Last Updated:** July 3, 2026
**Current Phase:** Finalizing Phase 5 (Real ML Model & DevOps)

## 📌 Project Overview
**PlantPlus** is a cross-platform (Web & Mobile) application backed by a Python FastAPI server. It allows farmers to upload or snap photos of crop leaves, running them through an AI model (**ConvNeXt-Tiny + Spatial Attention**) to detect crop diseases across 94 classes and provide immediate, AI-generated treatment advice.

---

## 🏗 Architecture & Stack
This repository is set up as a monorepo with 4 main components:

1. **`backend/` (FastAPI / Python)**
   - Exposes REST API endpoints (`/predict`, `/scans`, `/knowledge`, `/health`, `/gradcam`).
   - Uses **Firebase Admin SDK** for validating authentication tokens.
   - Uses **AWS S3** (`boto3`) for storing uploaded leaf images.
   - Uses **AWS DynamoDB** (`boto3`) for logging scan history.
   - Handles ML Inference via **ONNX Runtime (CPU)** for high speed, falling back to **PyTorch** dynamically when generating Grad-CAM heatmaps.
   - Reads secure keys from `backend/.env`.

2. **`mobile/` (React Native / Expo SDK 54)**
   - Cross-platform mobile app built with Expo.
   - Integrates `expo-camera` and `expo-image-picker` to take/upload photos.
   - Authenticates users via the **Firebase JS SDK** (uses AsyncStorage for persistence). Includes **Google Sign-In** via Expo AuthSession.
   - API Client (`axios`) automatically injects the Firebase JWT Token into the `Authorization: Bearer` header.
   - Reads secure keys from `mobile/.env` (`EXPO_PUBLIC_...`).

3. **`web/` (React / Vite)**
   - Web application equivalent of the mobile app.
   - Authenticates users via Firebase JS SDK.
   - Reads secure keys from `web/.env` (`VITE_...`).

4. **`shared/` (TypeScript definitions)**
   - Contains shared TS interfaces (like `PredictResponse`) used by both `web/` and `mobile/` clients to keep types synced with the backend.

---

## ✅ What Has Been Accomplished So Far
- **Rebranding:** App rebranded to **PlantPlus** with a fresh logo and UI updates.
- **Model Architecture Upgrade (ConvNeXt-Tiny + Spatial Attention):** The model was upgraded from EfficientNet-V2-S to **ConvNeXt-Tiny** with a custom **Spatial Attention** module (1x1 Conv → Sigmoid → element-wise multiply). The attention module highlights leaf lesion regions, improving interpretability. The architecture is defined in `backend/app/ml/network.py`.
- **Loss Function Upgrade (Focal Loss):** Replaced standard CrossEntropyLoss with a custom **Focal Loss** (`gamma=2.0`, optional per-class alpha weighting) in `backend/app/ml/losses.py` to handle severe class imbalance in the 94-class dataset.
- **Optimizer Upgrade (AdamW):** Switched to **AdamW** (`lr=1e-4`, `weight_decay=1e-2`) for superior weight decay handling with the ConvNeXt backbone.
- **Model Training:** The PyTorch model was trained on a **94-class** BD crop/vegetable/plant disease dataset from Hugging Face (`Saon110/bd-crop-vegetable-plant-disease-dataset`). Training scripts support both local (`scripts/train.py`) and Kaggle (`scripts/kaggle_train.py`) environments, with W&B logging.
- **ONNX Export:** A script (`backend/scripts/export_onnx.py`) successfully converts the heavy PyTorch `.pt` file into a highly optimized `.onnx` graph for lightning-fast CPU inference.
- **Automated Knowledge Generation:** A script (`backend/scripts/generate_knowledge.py`) uses the Gemini API to automatically crawl and generate agricultural treatment advice for all 94 classes.
- **Grad-CAM Visualizations:** A `/gradcam` endpoint was built to generate heatmaps showing exactly which parts of the leaf the AI is looking at to make its decision.
  - *Fixes applied:* Resolved an `IndexError` by dynamically unfreezing the PyTorch backbone (`requires_grad_(True)`) to allow gradient flow during memory loading, and implemented auto-loading to prevent crashes when generating heatmaps immediately after a server restart.
- **AWS Infrastructure Migration:** 
  - Successfully migrated storage away from Firebase. The backend now securely stores images in **AWS S3** (`ap-south-1`) and logs scan histories in **AWS DynamoDB**.
  - *Fixes applied:* Resolved a `403 Forbidden / SignatureDoesNotMatch` bug with S3 Presigned URLs by explicitly enforcing the `s3.ap-south-1.amazonaws.com` regional endpoint and `s3v4` signature version in `boto3`.
- **Frontend Bug Fixes:** 
  - Fixed severe CORS and Axios boundary stripping issues on the frontend that were breaking the Grad-CAM requests.
  - Verified and clarified empty-state handling for new accounts with 0 scans to gracefully show UI placeholders rather than throwing errors.

---

## ⚠️ Known Inconsistencies (Stale References)
The following files still contain **stale EfficientNet-V2-S references** that should be updated to reflect the ConvNeXt-Tiny architecture:

| File | Issue |
|------|-------|
| `backend/app/config.py` | `MODEL_ARCH` still says `"efficientnet_v2_s"`, `IMAGE_SIZE` comment references EfficientNet, weights filename is `efficientnet_v2_s_plantvillage.pt` |
| `backend/app/ml/transforms.py` | Comment says "standard EfficientNet preprocessing" |
| `backend/scripts/kaggle_train.py` | Uses old `EfficientNet_V2_S_Weights` and `efficientnet_v2_s()` — the Kaggle training script has NOT been updated to ConvNeXt |
| `backend/scripts/export_onnx.py` | Comment says "EfficientNetV2-S input size (1, 3, 300, 300)" |
| `backend/tests/test_inference.py` | Mocks `EfficientNetV2` which no longer exists |
| `backend/app/config.py` | `NUM_CLASSES` set to `38` but actual model has **94 classes** |
| Weight files | Named `efficientnet_v2_s_plantvillage.*` even though they now contain ConvNeXt-Tiny weights |

---

## 🚀 Next Steps (Where the next AI should pick up)

1. **Fix Stale References:**
   - Update `config.py` to reflect ConvNeXt-Tiny architecture, correct `NUM_CLASSES` to 94, and rename weight file references.
   - Update `kaggle_train.py` to use ConvNeXt-Tiny architecture (it still builds EfficientNet-V2-S).
   - Fix `test_inference.py` to mock the correct module.
   - Consider renaming weight files from `efficientnet_v2_s_*` to `convnext_tiny_*`.
2. **Dockerization & CI/CD:**
   - Dockerfiles and `docker-compose.yml` have been scaffolded but need to be updated to include ONNX Runtime and the new Python dependencies (`albumentations`, `grad-cam`, `onnx`, etc.), and then deployed to a cloud provider.
3. **Mobile App Polish:**
   - The Mobile app needs to be updated to support the new `Grad-CAM` feature that was just added to the Web app.
4. **Frontend Analytics:**
   - The React dashboard has a basic history view, but could use more advanced visual charts (e.g., Recharts) for tracking crop health over time.

---

## ⚠️ Important Developer Notes
- **Starting the Backend for Mobile Testing:**
  Always start the backend using `--host 0.0.0.0` so the physical phone on the same Wi-Fi network can connect to it:
  `uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`
- **Missing Firebase Errors (HTTP 401):**
  If you get HTTP 401 Unauthorized errors, ensure your `.env` contains the correct `FIREBASE_CREDENTIALS` path, that your Firebase Storage is initialized, and that you have recently logged into the frontend to generate a fresh token.
- **AWS Setup Required:**
  - The backend requires `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` to be set in the environment to write to S3 and DynamoDB.
  - The S3 bucket and DynamoDB table must be created in the `ap-south-1` region (or the region specified in `AWS_REGION`).
- **Axios FormData Warning:**
  When sending `FormData` via Axios on the frontend, DO NOT manually set `headers: { 'Content-Type': 'multipart/form-data' }`. Doing so strips the boundary string and causes FastAPI to crash with a 422 error.
