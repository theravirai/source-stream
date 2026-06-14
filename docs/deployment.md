# Deployment

This document explains the production deployment architecture for `source-stream`.

**Question:** How is the application deployed to production?

## Architecture Overview

`source-stream` is designed for a serverless, decoupled cloud deployment model. 
- **Backend:** Deployed as a containerized FastAPI application on Google Cloud Run.
- **Frontend:** Deployed as static assets on Firebase Hosting.
- **Data Stores:** Qdrant Cloud (Vector DB) and external LLM APIs (Groq, Gemini).

```mermaid
graph TD
    Client[Web Browser] -->|HTTPS| Firebase[Firebase Hosting]
    Firebase -.->|API Rewrite /api/*| CloudRun[Google Cloud Run (FastAPI)]
    CloudRun -->|gRPC / HTTPS| Qdrant[Qdrant Cloud]
    CloudRun -->|HTTPS| Groq[Groq API]
    CloudRun -->|HTTPS| Gemini[Google Gemini API]
```

## Backend (Google Cloud Run)

We use Cloud Run because it scales automatically to zero when there is no traffic and can scale horizontally to handle massive parallel ingestion or query loads.

### Build and Deploy
1. The backend uses a multi-stage `Dockerfile` optimized for `uv`.
2. The image is built and pushed to Google Artifact Registry.
3. The Cloud Run service is deployed with the required environment variables:
   - `GEMINI_API_KEY`
   - `GROQ_API_KEY`
   - `QDRANT_URL`
   - `QDRANT_API_KEY`

**Tradeoff Note:** Cloud Run instances are stateless. Any local files loaded via the Document Loader must be processed and embedded into Qdrant within the lifecycle of the request, as the container disk is ephemeral.

## Frontend (Firebase Hosting)

Firebase Hosting provides a global CDN for the React SPA. 

### API Rewrites
Instead of hardcoding the Cloud Run URL in the frontend code, we utilize Firebase `rewrites` in `firebase.json`:
```json
"rewrites": [
  {
    "source": "/api/**",
    "run": {
      "serviceId": "source-stream-backend",
      "region": "us-central1"
    }
  }
]
```
This ensures that all API calls to `/api/v1/...` bypass CORS restrictions, as the browser treats the backend as being on the same origin.

## CI/CD Pipeline
Deployment should ideally be automated via GitHub Actions, triggering a Cloud Build for the backend upon merges to the `main` branch, and a Firebase Deploy for the frontend.

## Cross-References
- For local setup instructions, see [README.md](../README.md).
- To troubleshoot deployment connection issues, see [troubleshooting.md](troubleshooting.md).
