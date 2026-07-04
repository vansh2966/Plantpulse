<div align="center">
  <h1>🌱 Plantpulse</h1>
  <p>An AI-powered cross-platform (Web & Mobile) crop disease diagnosis and treatment application.</p>
</div>

---

## 🚀 Overview

**Plantpulse** empowers farmers and agricultural enthusiasts to instantly detect plant diseases simply by taking a photo of a crop leaf. Using a custom-trained **ConvNeXt-Tiny** architecture augmented with a Spatial Attention module, the app detects **94 distinct classes** of crop conditions and diseases. 

Once diagnosed, the app provides an immediate, AI-generated treatment plan including chemical/organic treatments, nutrient recommendations, and pruning advice.

## 🏗️ Application Architecture

Plantpulse is built as a highly scalable monorepo comprising three main stacks:

### 1. `backend/` (FastAPI)
The core intelligence engine and API server.
- **ML Inference:** Uses **ONNX Runtime (CPU)** for blazing-fast predictions, seamlessly falling back to PyTorch when generating visual **Grad-CAM heatmaps**.
- **Auth & Security:** Validates JWT tokens using the **Firebase Admin SDK**.
- **Cloud Storage & Logging:** Uses **AWS S3** to store incoming leaf images and **DynamoDB** to log scan history and confidence scores.
- **Dynamic Knowledge Base:** Serves automated agricultural advice retrieved from an auto-generated JSON knowledge base.

### 2. `web/` (React + Vite + TailwindCSS)
The responsive web dashboard for desktop and mobile browsers.
- Integrates Firebase JS SDK for seamless Google Sign-in.
- Sends authorized image payloads to the backend API.

### 3. `mobile/` (React Native + Expo)
The native iOS and Android application.
- Uses `expo-camera` and `expo-image-picker` for native hardware integration.
- Persists user sessions via AsyncStorage and securely communicates with the backend.

---

## 🧠 AI Model & Training Pipeline

Our model isn't just an off-the-shelf CNN. We custom-built an architecture designed specifically to focus on microscopic leaf blemishes.

### Architecture
We started with **ConvNeXt-Tiny** (due to its excellent speed/accuracy tradeoff) and attached a custom **Spatial Attention Module**. This allows the network to aggressively focus on the diseased lesions on the leaf rather than the background soil or healthy green tissue.

### Dataset & Preprocessing
The model was trained on a robust dataset containing **94 classes** of healthy and diseased crops.
- **Heavy Augmentation:** We utilized `Albumentations` to apply Random Resized Crops, Affine transformations, HSV shifts, Motion Blur, and Random Sun Flares to ensure the model is invariant to field-lighting conditions.
- **Loss Function:** We used **Focal Loss** (`gamma=2.0`) to handle severe class imbalances (e.g., extremely rare diseases vs. common healthy leaves).

### How We Did It
1. **Training Environment:** The model was trained headlessly using PyTorch in a Kaggle environment. We used Hugging Face Datasets for streaming and Weights & Biases (W&B) for silent logging.
2. **ONNX Export:** To achieve lightning-fast CPU inference on the backend, we traced the PyTorch model (`.pt`) and exported it into an optimized **ONNX computation graph**.
3. **Automated Knowledge:** We wrote a custom pipeline (`generate_knowledge.py`) that utilizes Google's Gemini API to automatically crawl and generate personalized treatment advice, nutrient requirements, and pruning guidelines for all 94 classes.

---

## 🛠️ Setup & Installation

### Backend
```bash
cd backend
python -m venv venv
# Windows
.\venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Web
```bash
cd web
npm install
npm run dev
```

### Mobile
```bash
cd mobile
npm install
npx expo start
```

## 🔒 Security & Credentials
To run this project locally, you must provide your own `.env` files.
* **Backend:** Requires AWS Keys (`AWS_ACCESS_KEY_ID`), Firebase Admin SDK JSON, and S3/DynamoDB configuration.
* **Frontend/Mobile:** Requires Firebase Web Client configuration keys.

---
*Built with ❤️ for modern agriculture.*
