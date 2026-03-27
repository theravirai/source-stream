# Source Stream 🌊

Source Stream is an enterprise-grade, high-performance RAG (Retrieval-Augmented Generation) application designed for indexing complex local PDFs and scraping live web documentation, enabling natural language questions with grounded citations.

## Technical Stack

- **Backend**: FastAPI, LangChain, Groq API (via `langchain-groq`), Gemini Embeddings, Qdrant Vector DB (Cloud), Beautiful Soup 4, lxml, pypdf
- **Frontend**: Vite, React (JS), Lucide Icons, Vanilla CSS
- **Package Managers**: `uv` (Python), `npm` (Node)

## Getting Started

### Prerequisites

- Python >= 3.11
- Node.js >= 18
- `uv` (Fast Python package installer and resolver)

### Installation

1. Clone the repository.
2. Initialize backend environment:
   ```bash
   cd backend
   uv venv
   uv pip install -r requirements.txt
   ```
3. Initialize frontend environment:
   ```bash
   cd frontend
   npm install
   ```

### Running the Application

1. **Start the backend server:**
   ```bash
   cd backend
   uv run uvicorn app.main:app --reload --port 8000
   ```
2. **Start the frontend client:**
   ```bash
   cd frontend
   npm run dev
   ```
3. Visit `http://localhost:5173/` in your browser.
