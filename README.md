<div align="center">
  <h1>PlantPulse</h1>
  <p>A cross-platform application for crop disease diagnosis and treatment recommendations.</p>
  <br />
  <p>
    <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
    <img src="https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Native" />
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/PyTorch-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white" alt="PyTorch" />
    <img src="https://img.shields.io/badge/ONNX-005CED?style=for-the-badge&logo=onnx&logoColor=white" alt="ONNX" />
    <img src="https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge" alt="License" />
  </p>
</div>

---

## Overview

PlantPulse helps identify plant diseases from photos of crop leaves. 

It uses a custom-trained ConvNeXt-Tiny architecture with a CBAM (Convolutional Block Attention Module) to detect 94 different crop conditions across several plant species, including tomato, apple, potato, sugarcane, tea, rice, jute, guava, cotton, corn, cauliflower, banana, and papaya.

Once a diagnosis is made, PlantPulse provides a treatment plan that includes chemical and organic treatment options, nutrient recommendations, and pruning advice tailored to the specific condition.

---

## System Architecture 

PlantPulse is organized as a monorepo with three main components: a FastAPI backend, a React web dashboard, and a React Native mobile application. 

```mermaid
graph TD
    subgraph Frontend
        M[React Native Mobile App]
        W[React Web Dashboard]
    end

    subgraph Authentication
        FA[Firebase Authentication]
    end

    subgraph Backend Core
        API[FastAPI Server]
        AuthMiddleware[Auth Middleware]
        OR[PyTorch / ONNX Engine]
        PT[Grad-CAM Visualization]
        KB[JSON Knowledge Base]
    end

    subgraph Cloud Infrastructure
        S3[AWS S3: Image Storage]
        DB[AWS DynamoDB: Scan Logs]
    end

    M -- Login --> FA
    W -- Login --> FA
    M -- Image + JWT Token --> API
    W -- Image + JWT Token --> API
    
    API -- Validates JWT --> AuthMiddleware
    AuthMiddleware -- Checks with --> FA
    
    API -- Saves Raw Image --> S3
    
    API -- Tensor Data --> OR
    OR -- Prediction --> API
    
    API -- Heatmap Gen Request --> PT
    PT -- Grad-CAM Overlay --> API
    
    API -- Query Class Advice --> KB
    KB -- Treatment Plan --> API
    
    API -- Log Scan History --> DB
    
    API -- JSON Response + Advice --> M
    API -- JSON Response + Advice --> W
```

### 1. apps/api/ (FastAPI)
The backend API server handles the core logic.
- ML Inference: Runs the model to generate predictions.
- Grad-CAM Visualization: Uses PyTorch to generate visual gradient class activation maps (Grad-CAM), highlighting where the model focused on the leaf.
- Authentication: Validates JWT tokens using the Firebase Admin SDK.
- Cloud Storage and Logging: Uses AWS S3 to store uploaded leaf images and DynamoDB to log scan history.
- Knowledge Base: Serves automated agricultural advice retrieved from a structured JSON file.

### 2. apps/web/ (React + Vite + TailwindCSS)
The responsive web dashboard for desktop and mobile browsers.
- Integrates Firebase JS SDK for Google Sign-in.
- Built with Tailwind CSS for styling.

### 3. apps/mobile/ (React Native + Expo)
The native iOS and Android application.
- Uses expo-camera and expo-image-picker for capturing photos.
- Manages user sessions via AsyncStorage and communicates with the backend via Axios.

---

## Model and Training Pipeline

We built a custom architecture to focus on the specific visual features of leaf diseases.

```mermaid
flowchart LR
    A[Raw 94-Class Dataset] --> B[Albumentations Augmentation]
    B --> C[CBAM Attention Module]
    C --> D[ConvNeXt-Tiny Backbone]
    D --> E[Focal Loss Optimization]
    E -- PyTorch Checkpoint --> F[.pth Model File]
    
    subgraph Knowledge Generation
        F -- Extract Classes --> H[Gemini Prompt Engine]
        H -- Auto-Generation --> I[knowledge_base.json]
    end
    
    F --> J[Production Server]
    I --> J
```

### The Architecture
We started with ConvNeXt-Tiny to balance speed and accuracy, and added a custom CBAM (Convolutional Block Attention Module) layer. This module forces the network to focus on the diseased lesions on the leaf rather than background soil or healthy tissue. We also upgraded the classifier head to a deeper MLP for better decision boundaries.

### Dataset and Preprocessing
The model was trained on a dataset containing 94 classes of healthy and diseased crops.
- Augmentation: We used Albumentations to apply random resized crops, affine transformations, HSV shifts, motion blur, and random sun flares to simulate real-world field conditions.
- Loss Function: We used Focal Loss to handle class imbalances in the dataset, ensuring rare diseases are still learned effectively.
- TTA: Test-Time Augmentation is used during inference to average predictions across multiple variations of the input image, improving overall confidence.

### How We Built It
1. Training Environment: The model was trained using PyTorch, utilizing Hugging Face Datasets for streaming and Weights & Biases for metric logging.
2. Automated Knowledge: We created a pipeline (apps/api/scripts/generate_knowledge.py) that uses Google's Gemini API to generate treatment advice, nutrient requirements, and pruning guidelines for all 94 classes, which is saved as a static JSON file.

---

## Training Metrics

- Training Loss / Validation Loss:
- <img width="3792" height="1992" alt="Training Loss Chart" src="https://github.com/user-attachments/assets/b762b95e-bd1f-40a6-9a80-24ef8e81710c" />

- <img width="3792" height="1992" alt="Validation Loss Chart" src="https://github.com/user-attachments/assets/cefa99f5-d977-4950-ba27-64953084df17" />

- Training Accuracy / Validation Accuracy:
- <img width="3792" height="1992" alt="Training Accuracy Chart" src="https://github.com/user-attachments/assets/74feebe0-c27e-4d5d-ac77-c066f1eed65c" />

- <img width="3792" height="1992" alt="Validation Accuracy Chart" src="https://github.com/user-attachments/assets/0cbf4ef4-e0a1-499b-8094-f7c97c86c670" />

---

## Setup and Installation

### API / Backend
```bash
# Move to the API directory
cd apps/api

# Create and activate a virtual environment
python -m venv venv

# Windows
.\venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the server (Alternatively, run "npm run dev:api" from the root directory)
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*(Note: To test the mobile app on a physical device, start the server using --host 0.0.0.0)*

### Web
```bash
# Move to the Web directory
cd apps/web

# Install dependencies and start the dev server
npm install
npm run dev
```

### Mobile
```bash
# Move to the Mobile directory
cd apps/mobile

# Install dependencies and start Expo
npm install
npx expo start
```

## Configuration
To run this project locally, you need to provide your own `.env` files.
* Backend: Requires AWS Keys (AWS_ACCESS_KEY_ID), Firebase Admin SDK JSON credentials, and S3/DynamoDB configuration.
* Frontend/Mobile: Requires Firebase Web Client configuration keys.

---
*Built for modern agriculture.*
