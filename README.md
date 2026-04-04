# Source Stream 🌊

Source Stream is an enterprise-grade, high-performance RAG (Retrieval-Augmented Generation) application designed for indexing complex local PDFs, scraping live web documentation, and querying them through a modern chat interface with grounded citations.

The ingestion pipeline is designed with a decoupled, modular architecture adhering to the single responsibility principle.

---

## 🛠 Project Status & Pipeline Stages

The ingestion pipeline is built in step-by-step modular stages:
1. **Document Loading**: Extracts raw text from plain text files (`.txt`), local PDF documents (`.pdf`), and documentation websites (recursive crawl restricting to same domain).
2. **Text Chunking**: Segments documents into smaller, overlapping chunks using LangChain's `RecursiveCharacterTextSplitter` to fit LLM context limits and retain semantic meaning.
3. **Embeddings & Indexing**: *[Planned]* Will embed text chunks using Gemini Embeddings and index them in Qdrant Cloud.
4. **RAG Core & Chat**: *[Planned]* Will retrieve relevant chunks and generate answers using Groq API with sources.

---

## 💻 Tech Stack

- **Backend**: FastAPI, LangChain (including `langchain-text-splitters`), Groq API, Gemini Embeddings, Qdrant Vector DB, BeautifulSoup4, `lxml`, `pypdf`, `uv`
- **Frontend**: Vite, React (JS), Lucide Icons, Vanilla CSS
- **Package Managers**: `uv` (Python), `npm` (Node)

---

## 🚀 Getting Started

### Prerequisites
- Python >= 3.11
- Node.js >= 18
- `uv` (Fast Python package manager)

### Installation

1. **Clone the repository.**
2. **Initialize backend environment and install dependencies:**
   ```bash
   cd backend
   uv venv
   uv pip install -r requirements.txt
   ```
3. **Initialize frontend environment and install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

### Running the Application

1. **Start the backend server:**
   ```bash
   cd backend
   PYTHONPATH=. uv run uvicorn app.main:app --reload --port 8000
   ```
2. **Start the frontend client:**
   ```bash
   cd frontend
   npm run dev
   ```
3. Open `http://localhost:5173/` in your browser.

---

## 🔌 API Endpoints

### Document Loader
- `POST /api/v1/document-loader/text` - Load a `.txt` file and get raw text.
- `POST /api/v1/document-loader/pdf` - Load a `.pdf` file page-by-page.
- `POST /api/v1/document-loader/website` - Crawl a URL up to a maximum depth.

### Text Splitter
- `POST /api/v1/text-splitter/split` - Split loaded documents into chunks based on `chunk_size` and `chunk_overlap`.

---

## 🧪 Running Tests

Verify the backend modules using `pytest`:
```bash
cd backend
PYTHONPATH=. uv run pytest
```
