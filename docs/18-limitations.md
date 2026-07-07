# Known Limitations & Constraints

This document provides an honest engineering assessment of the current constraints within `source-stream`.

**Question:** What are the current tradeoffs and constraints?

## 1. Multi-User Tenancy

**Constraint:** The application currently relies on a single shared Qdrant index (`source_stream`). 
**Impact:** If multiple users interact with the deployed application simultaneously, their uploaded documents will all mix into the same vector space. When querying, the LLM might retrieve chunks from User A's uploaded PDF to answer User B's question.
**Tradeoff:** This was intentionally deferred to simplify the MVP ingestion pipeline and avoid complex database partitioning logic during initial development.

## 2. In-Memory Container State

**Constraint:** The FastAPI backend relies on ephemeral container storage (Cloud Run) to temporarily house uploaded PDFs and text files before passing them to the Document Loaders.
**Impact:** If an extremely large PDF is uploaded, it may consume the available container memory, causing an out-of-memory (OOM) crash.
**Tradeoff:** Using a dedicated blob storage bucket (like AWS S3 or Google Cloud Storage) for intermediate holding would solve this but adds infrastructure overhead and deployment complexity.

## 3. Limited Semantic Routing

**Constraint:** The RAG core always performs a vector search against the Qdrant DB. 
**Impact:** If a user types conversational pleasantries ("Hello, how are you?"), the system will still attempt to retrieve vector chunks, burning API tokens and adding latency to find mathematically irrelevant data.
**Tradeoff:** We currently rely on the pre-retrieval Guardrails to block completely out-of-scope queries, but a dedicated semantic router (e.g., using a classification layer to bypass retrieval entirely for greetings) would be more efficient.
