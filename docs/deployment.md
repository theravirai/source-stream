# Production Deployment Guide

This guide describes how to deploy the `source-stream` application to production environments.

---

## 🔑 Production Environment Variables

You must configure the following environment variables in your production hosting environments:

### Backend Variables (Google Cloud Run)
* **`GEMINI_API_KEY`**: Your Google AI Studio production API key.
* **`QDRANT_URL`**: The URL to your production Qdrant Cloud cluster.
* **`QDRANT_API_KEY`**: The access token for the production Qdrant database.
* **`QDRANT_COLLECTION`**: Name of the collection (e.g. `source_stream_prod`).
* **`GROQ_API_KEY`**: The Groq API key for LLM-grounded synthesis (used in RAG stage).
* **`CORS_ORIGINS`**: A JSON array containing allowed origins (e.g. `["https://source-stream-prod.web.app"]`). Kept as a defensive fallback for direct Cloud Run access.
* **`LOG_LEVEL`**: Typically set to `WARNING` or `ERROR` in production to reduce log bloat, or `INFO` for general monitoring.

### Frontend Variables (Firebase Hosting)
Because Firebase Hosting uses path rewrites to seamlessly proxy `/api/**` traffic to Google Cloud Run, the frontend does not require direct URL configurations like `VITE_API_URL`. All `fetch` requests can use relative paths (e.g., `/api/v1/...`).

---

## 🐳 Backend Deployment: Google Cloud Run

Google Cloud Run provides a fully managed, scalable container hosting platform.

### Step 1: Install and Authenticate Google Cloud CLI
Ensure you have the `gcloud` CLI installed and authenticated to your GCP project.
```bash
gcloud auth login
gcloud config set project your-gcp-project-id
```

### Step 2: Deploy to Cloud Run
From the `backend/` directory, deploy using `gcloud run deploy`. This command can automatically build your image using Cloud Build or use an image you built manually.

```bash
cd backend
gcloud run deploy source-stream-backend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=...,QDRANT_URL=...,QDRANT_API_KEY=...,QDRANT_COLLECTION=...,GROQ_API_KEY=...
```
*(Alternatively, configure secrets in Google Secret Manager for better security).*

---

## ⚡ Frontend Deployment: Firebase Hosting

Firebase Hosting serves the Vite + React Single Page Application and seamlessly proxies API requests to Cloud Run via native rewrite rules.

### Step 1: Install Firebase Tools
If you haven't already, install the Firebase CLI and login:
```bash
npm install -g firebase-tools
firebase login
```

### Step 2: Set Project ID
Update the placeholder in `frontend/.firebaserc` to your actual Firebase project ID:
```json
{
  "projects": {
    "default": "your-firebase-project-id"
  }
}
```

### Step 3: Build and Deploy
From the `frontend/` directory, build the Vite application and deploy to Firebase Hosting:
```bash
cd frontend
npm run build
firebase deploy
```

Firebase will upload the `dist/` directory and apply the rules in `firebase.json` to proxy `/api/**` traffic directly to your `source-stream-backend` on Cloud Run.
