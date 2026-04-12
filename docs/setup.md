# Setup and Configuration Guide

This guide details how to install, configure, and run `source-stream` locally for development.

---

## 📋 Prerequisites

Ensure you have the following installed on your system:
* **Python >= 3.11**
* **Node.js >= 18** (with `npm`)
* **uv** (high-performance Python package installer and resolver. Install via `curl -LsSf https://astral.sh/uv/install.sh | sh` or `brew install uv`)
* **Docker** (optional, only needed if you want to run Qdrant locally)

---

## ⚙️ Installation

Follow these steps to set up the codebase locally:

### 1. Clone the Repository
```bash
git clone <repository-url>
cd source-stream
```

### 2. Configure the Backend Environment
We use `uv` for managing Python dependencies.
```bash
cd backend
# Create a virtual environment
uv venv
# Activate the environment
source .venv/bin/activate  # On Windows use: .venv\Scripts\activate
# Install backend dependencies
uv pip install -r requirements.txt
```

### 3. Configure the Frontend Environment
```bash
cd ../frontend
# Install npm packages
npm install
```

---

## 🔑 Environment Variables

The backend application loads configuration from a `.env` file in the project root or the `backend/` directory.

Create a `.env` file in the root of the project with the following keys:

| Variable | Description | Required / Optional | Default Value |
| :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | Google AI Studio API Key used for generating text embeddings. | **Required** | None |
| `QDRANT_URL` | URL of the Qdrant database instance (Cloud URL or localhost). | **Required** | None |
| `QDRANT_API_KEY` | API authentication key for secure Qdrant instances. | Optional (Required for Qdrant Cloud) | None |
| `QDRANT_COLLECTION` | The Qdrant collection name to store vector data. | Optional | `source_stream` |
| `GROQ_API_KEY` | API Key for Groq access (used in the RAG synthesis stage). | Optional | None |
| `LOG_LEVEL` | Logging verbosity (`DEBUG`, `INFO`, `WARNING`, `ERROR`). | Optional | `INFO` |

Example `.env` content:
```env
GEMINI_API_KEY=your_gemini_api_key_here
QDRANT_URL=https://your-qdrant-instance.cloud.qdrant.io
QDRANT_API_KEY=your_qdrant_api_key_here
QDRANT_COLLECTION=source_stream
GROQ_API_KEY=your_groq_api_key_here
LOG_LEVEL=INFO
```

---

## 🛠 Service Configuration

### 1. Google Gemini (Embeddings)
The system uses the Gemini Embeddings model (`models/gemini-embedding-001`) via LangChain to convert chunked text into high-dimensional vectors.
* **Get an API Key**: Visit the [Google AI Studio](https://aistudio.google.com/) and create a free API key.
* Add this key to your `.env` as `GEMINI_API_KEY`.

### 2. Qdrant (Vector Database)
You can connect `source-stream` to a managed cloud cluster or run Qdrant locally.

#### Option A: Running Qdrant Cloud (Recommended)
1. Sign up for a free tier account at [Qdrant Cloud](https://cloud.qdrant.io/).
2. Create a new cluster.
3. Once active, copy the **Cluster URL** (e.g., `https://xxxxxx.gcp.cloudflare.qdrant.io`) and set it as `QDRANT_URL`.
4. Create an API Key in the cluster dashboard, copy it, and set it as `QDRANT_API_KEY`.

#### Option B: Running Qdrant Locally (Docker)
If you prefer not to use Qdrant Cloud, run Qdrant locally in a Docker container:
```bash
docker run -p 6333:6333 -p 6334:6334 \
    -v $(pwd)/qdrant_storage:/qdrant/storage:z \
    qdrant/qdrant
```
In your `.env` configuration, point to the local instance (an API Key is not required for local runs):
```env
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=
```

---

## 🚀 Local Development

Once the services are configured, you can start the application:

### 1. Run the FastAPI Backend
Ensure your virtual environment is active, and start the development server:
```bash
cd backend
PYTHONPATH=. uv run uvicorn app.main:app --reload --port 8000
```
The API documentation will be available at `http://localhost:8000/docs`.

### 2. Run the React Frontend (Vite)
Start the Vite development server:
```bash
cd frontend
npm run dev
```
Open `http://localhost:5173` in your browser. The Vite dev server is configured to proxy API requests to `http://localhost:8000`.

### 3. Run Backend Verification Tests
Verify all units are functioning correctly:
```bash
cd backend
PYTHONPATH=. uv run pytest
```
