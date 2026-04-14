# Production Deployment Guide

This guide describes how to deploy the `source-stream` application to production environments. 

---

## 🔑 Production Environment Variables

You must configure the following environment variables in your production hosting environments:

### Backend Variables (Hugging Face Spaces)
* **`GEMINI_API_KEY`**: Your Google AI Studio production API key.
* **`QDRANT_URL`**: The URL to your production Qdrant Cloud cluster.
* **`QDRANT_API_KEY`**: The access token for the production Qdrant database.
* **`QDRANT_COLLECTION`**: Name of the collection (e.g. `source_stream_prod`).
* **`GROQ_API_KEY`**: The Groq API key for LLM-grounded synthesis (used in RAG stage).
* **`CORS_ORIGINS`**: A JSON array containing the Vercel deployment URL to grant CORS permission (e.g. `["https://your-app.vercel.app"]`).
* **`LOG_LEVEL`**: Typically set to `WARNING` or `ERROR` in production to reduce log bloat, or `INFO` for general monitoring.

### Frontend Variables (Vercel)
If you configure Vercel with path rewrites, no environment variables are strictly required on the client side since requests to `/api/*` are forwarded automatically. However, if direct CORS requests are preferred, define:
* **`VITE_API_URL`**: The URL of your Hugging Face Space endpoint (e.g., `https://username-space-name.hf.space`).

---

## 🐳 Backend Deployment: Hugging Face Spaces (Docker)

Hugging Face Spaces provides a free-tier hosting solution that supports custom Docker environments.

### Step 1: Create a Space
1. Log in to [Hugging Face](https://huggingface.co/).
2. Create a new Space.
3. Select **Docker** as the SDK.
4. Select **Blank** as the template.

### Step 2: Create a Dockerfile
Create a `Dockerfile` inside the `backend/` directory of your project. Here is a recommended production configuration:

```dockerfile
# backend/Dockerfile
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install uv for fast dependency installation
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.local/bin:${PATH}"

WORKDIR /code

# Copy dependency files
COPY pyproject.toml requirements.txt /code/

# Install python packages globally inside the container
RUN uv pip install --system --no-cache -r requirements.txt

# Copy backend app files
COPY app /code/app

# Hugging Face Spaces requires running under UID 1000 to avoid permission blocks
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user
ENV PATH=/home/user/.local/bin:$PATH

# Hugging Face Spaces expects traffic on port 7860
EXPOSE 7860

# Run Uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
```

### Step 3: Add Secrets in Hugging Face Settings
Go to your Space's **Settings** tab and add the required variables (`GEMINI_API_KEY`, `QDRANT_URL`, `QDRANT_API_KEY`, `GROQ_API_KEY`, `CORS_ORIGINS`) as **Variables** or **Secrets**.

### Step 4: Push to Hugging Face
You can push your repository to the Hugging Face Git remote, or configure a GitHub Action to deploy automatically when updates land on the main branch.

---

## ⚡ Frontend Deployment: Vercel

Vercel is the recommended hosting platform for Vite + React applications due to its global CDN distribution.

### Step 1: Connect Repository to Vercel
1. Log in to your [Vercel](https://vercel.com/) dashboard.
2. Select **Add New** > **Project** and import your Git repository.

### Step 2: Configure Project Settings
* **Framework Preset**: Vite
* **Root Directory**: `frontend`
* **Build Command**: `npm run build`
* **Output Directory**: `dist`
* **Install Command**: `npm install`

### Step 3: Set Up Rewrite Proxy Rules
To avoid CORS issues and simplify frontend requests, configure Vercel to route traffic going to `/api/*` straight to your Hugging Face Space backend. 

Create a `vercel.json` file inside the `frontend/` folder:

```json
{
  "rewrites": [
    {
      "source": "/api/v1/:path*",
      "destination": "https://<your-username>-<your-space-name>.hf.space/api/v1/:path*"
    }
  ]
}
```
*Replace `<your-username>-<your-space-name>` with your actual Hugging Face Space subdomain.*

### Step 4: Deploy
Click **Deploy**. Once Vercel finishes building, your frontend will be live. Ensure that the Vercel deployment URL is added to the backend's `CORS_ORIGINS` list on Hugging Face to avoid API request rejections.
