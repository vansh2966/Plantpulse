# CropAI v2 Deployment Guide

## 1. Backend Deployment (Hugging Face Spaces)

We recommend using **Hugging Face Docker Spaces** for hosting the backend due to its generous free tier and fast CPU/GPU access for machine learning inference.

### Setup Steps
1. Create a new Space on Hugging Face:
   - Select **Docker** as the space SDK.
   - Choose a blank Docker template.
2. Clone your Space repository locally.
3. Copy the contents of the `backend/` directory into the Space repository.
4. Rename `backend/Dockerfile` to `Dockerfile` if it's not already at the root of the Space.
5. Hugging Face Spaces expose port `7860` by default. Our Dockerfile is configured to run on port `8000`, so make sure to override the command in Hugging Face or update the `CMD` in Dockerfile:
   ```dockerfile
   CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
   ```
6. Add the following secrets to your Hugging Face Space settings:
   - `FIREBASE_CREDENTIALS` (JSON string)
   - `FIREBASE_STORAGE_BUCKET`
   - `SENTRY_DSN` (Optional, for error tracking)
   - `ENVIRONMENT` = `production`

## 2. Frontend Deployment (Vercel or Netlify)

1. Connect your GitHub repository to Vercel or Netlify.
2. Set the root directory to `web/`.
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Add the environment variables to your hosting provider:
   - `VITE_API_URL`: Your Hugging Face Space URL (e.g., `https://username-cropai-backend.hf.space/api/v1`)
   - `VITE_FIREBASE_API_KEY`, etc.

## 3. Mobile Deployment (Expo EAS)

1. Install EAS CLI: `npm install -g eas-cli`
2. Login to Expo: `eas login`
3. Configure the project: `eas build:configure`
4. Create a production build:
   - Android: `eas build -p android --profile production`
   - iOS: `eas build -p ios --profile production`
5. Submit to App Store / Google Play using `eas submit`.

## 4. Error Tracking (Sentry)

The backend is pre-configured with Sentry SDK. 
1. Create a project in [Sentry.io](https://sentry.io/).
2. Copy the **DSN** provided.
3. Add `SENTRY_DSN` to your backend environment variables (Hugging Face / Render).
4. The backend will automatically report unhandled exceptions and performance traces to your Sentry dashboard.
