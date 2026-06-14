# API Documentation

This document describes the API endpoints exposed by the `source-stream` FastAPI backend.

---

## 1. System Endpoints

### Health Check

Returns the status and uptime of the backend service.

* **URL:** `/api/v1/health`
* **Method:** `GET`
* **Response Model:**
  ```json
  {
    "status": "ok",
    "uptime_seconds": 120,
    "timestamp": "2026-04-12T11:42:01.123456Z"
  }
  ```

---

## 2. Document Loader Endpoints

These endpoints parse raw content (text, PDF, or website) and return standard LangChain-compatible document structures.

### Load Text File

* **URL:** `/api/v1/document-loader/text`
* **Method:** `POST`
* **Content-Type:** `multipart/form-data`
* **Request Parameters:**
  - `file`: A `.txt` file upload.
* **Response Model:** `List[DocumentResponse]`
  ```json
  [
    {
      "page_content": "Example text content of the file...",
      "metadata": {
        "source": "example.txt"
      }
    }
  ]
  ```

### Load PDF File

* **URL:** `/api/v1/document-loader/pdf`
* **Method:** `POST`
* **Content-Type:** `multipart/form-data`
* **Request Parameters:**
  - `file`: A `.pdf` file upload.
* **Response Model:** `List[DocumentResponse]`
  ```json
  [
    {
      "page_content": "Text parsed from PDF page 1...",
      "metadata": {
        "source": "example.pdf",
        "page": 0
      }
    }
  ]
  ```

### Load Website URL

Recursively crawls a website up to a maximum depth and extracts page content.

* **URL:** `/api/v1/document-loader/website`
* **Method:** `POST`
* **Content-Type:** `application/json`
* **Request Body:**
  ```json
  {
    "url": "https://example.com/docs",
    "max_depth": 2
  }
  ```
  - `url` (string, required): The starting URL.
  - `max_depth` (integer, optional, default: 2, range: 1-5): Crawl depth limit.
* **Response Model:** `List[DocumentResponse]`
  ```json
  [
    {
      "page_content": "Extracted website content...",
      "metadata": {
        "source": "https://example.com/docs/page-1",
        "title": "Page 1 Title"
      }
    }
  ]
  ```

---

## 3. Text Splitter Endpoints

### Split Documents

Splits a list of documents into smaller, overlapping chunks using recursive character splitting.

* **URL:** `/api/v1/text-splitter/split`
* **Method:** `POST`
* **Content-Type:** `application/json`
* **Request Body:**
  ```json
  {
    "documents": [
      {
        "page_content": "Very long text that needs to be split...",
        "metadata": {
          "source": "example.txt"
        }
      }
    ],
    "chunk_size": 1000,
    "chunk_overlap": 200
  }
  ```
  - `documents` (list, required): The array of documents to split.
  - `chunk_size` (integer, optional, default: 1000, range: 100-10000): Maximum character length of each chunk.
  - `chunk_overlap` (integer, optional, default: 200, ge: 0): Character overlap between consecutive chunks. Must be strictly less than `chunk_size`.
* **Response Model:** `List[DocumentResponse]`
  ```json
  [
    {
      "page_content": "First chunk content...",
      "metadata": {
        "source": "example.txt",
        "chunk_index": 0
      }
    },
    {
      "page_content": "Second chunk content...",
      "metadata": {
        "source": "example.txt",
        "chunk_index": 1
      }
    }
  ]
  ```

---

## 4. Vector Store Endpoints

These endpoints handle embedding generation (using Gemini Embeddings) and storage/searching in Qdrant Cloud.

### Index Documents

Generates embeddings and upserts document chunks into Qdrant.

* **URL:** `/api/v1/vector-store/index`
* **Method:** `POST`
* **Content-Type:** `application/json`
* **Request Body:**
  ```json
  {
    "documents": [
      {
        "page_content": "Chunk content to embed...",
        "metadata": {
          "source": "example.txt",
          "chunk_index": 0
        }
      }
    ]
  }
  ```
* **Response Model:**
  ```json
  {
    "status": "success",
    "message": "Successfully indexed 1 chunks in Qdrant collection 'source_stream'",
    "indexed_count": 1,
    "collection": "source_stream"
  }
  ```

### Search Vector Store

Performs similarity retrieval against the index based on a natural language query.

* **URL:** `/api/v1/vector-store/search`
* **Method:** `POST`
* **Content-Type:** `application/json`
* **Request Body:**
  ```json
  {
    "query": "How does the ingestion work?",
    "k": 4
  }
  ```
  - `query` (string, required): Natural language search terms.
  - `k` (integer, optional, default: 4, range: 1-20): Number of matches to return.
* **Response Model:** `List[SearchResultResponse]`
  ```json
  [
    {
      "page_content": "First matching chunk content...",
      "metadata": {
        "source": "example.txt",
        "chunk_index": 0
      },
      "score": 0.8954
    }
  ]
  ```

### Get Vector Store Status

Retrieves current statistics about the Qdrant collection, including active status, points count, and dimension parameters.

* **URL:** `/api/v1/vector-store/status`
* **Method:** `GET`
* **Response Model:**
  ```json
  {
    "collection_name": "source_stream",
    "status": "green",
    "chunks_count": 48,
    "vector_size": 3072
  }
  ```

### Clear Vector Store Collection

Deletes the existing Qdrant collection and creates a fresh empty collection, resetting the pipeline.

* **URL:** `/api/v1/vector-store/clear`
* **Method:** `POST`
* **Response Model:**
  ```json
  {
    "status": "success",
    "message": "Collection 'source_stream' successfully cleared and recreated."
  }
  ```

---


## 5. Retriever Endpoints

These endpoints perform document retrieval and synthesize context-grounded answers using the Groq LLM API.

### Query RAG Model

Retrieves relevant document chunks and synthesizes a response using the configured Groq LLM model.

* **URL:** `/api/v1/retriever/query`
* **Method:** `POST`
* **Content-Type:** `application/json`
* **Request Body:**
  ```json
  {
    "query": "What is LangChain?",
    "k": 4
  }
  ```
  - `query` (string, required): The natural language query.
  - `k` (integer, optional, default: 4, range: 1-20): Number of context documents to retrieve.
* **Response Model:** `QueryResponse`
  ```json
  {
    "query": "What is LangChain?",
    "answer": "LangChain is an open-source development framework...",
    "source_documents": [
      {
        "page_content": "LangChain is an open-source development framework...",
        "metadata": {
          "source": "example.txt",
          "chunk_index": 0
        },
        "score": 0.8954
      }
    ],
    "retrieved_candidates": [],
    "telemetry": {
      "total_duration_ms": 1240.5,
      "prompt_tokens": 850,
      "completion_tokens": 120,
      "steps": [
        {
          "name": "Input validation",
          "duration_ms": 150.2,
          "status": "SAFE",
          "details": null
        },
        {
          "name": "Document Search",
          "duration_ms": 400.1,
          "status": "PASSED",
          "details": {
            "retrieved_chunks": 4,
            "citations_selected": 4
          }
        }
      ]
    }
  }
  ```

