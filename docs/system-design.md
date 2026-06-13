# System Design

This document details the high-level system design and component interactions of `source-stream`.

**Question:** How do the system components integrate and scale to provide a reliable RAG pipeline?

## Design Philosophy

The architecture is driven by three core principles:
1. **Decoupled Stages:** Each phase of the ingestion pipeline (Loading -> Splitting -> Embedding) is distinct. The backend does not perform these automatically in one massive block; instead, the frontend coordinates them. This allows for intermediate inspection and testing of output at every stage.
2. **Stateless Backend:** The FastAPI backend holds no in-memory session state. All required state (like which documents to index) is passed by the client or stored persistently in the Vector Store.
3. **Observability First:** The RAG process is inherently opaque. The system is designed to surface hidden metrics (tokens, latency, retrieved chunk scores) directly to the user interface.

## Component Interaction Overview

### 1. The Orchestrator (Client)
The React SPA acts as the orchestrator. Rather than sending a document to a single `/ingest` endpoint, the client pushes the document through the pipeline via separate API calls. This enables the UI to display progress and allow user intervention (e.g., tweaking chunk sizes) before the next stage.

### 2. The API Layer (FastAPI)
The API layer acts purely as a routing and validation layer. It uses Pydantic to ensure the client is sending well-formed requests. It contains no business logic; it simply unwraps the HTTP request and delegates it to the appropriate Service.

### 3. The Services Layer
Each service has a single responsibility:
- **Document Loader:** Unifies disparate sources (PDF, Web, Text) into a common `Document` interface.
- **Text Splitter:** Applies NLP/Chunking logic.
- **Vector Store & Embeddings:** Manages network calls to Google Gemini and Qdrant. 
- **RAG Core:** Uses LangChain LCEL to orchestrate the retrieval and generation prompt.

By isolating these, we can unit test the Text Splitter without needing to mock Qdrant, or test Qdrant without needing to mock the LLM.

### 4. Telemetry Interceptor
The Telemetry system operates as an interceptor. Instead of polluting the core RAG logic with `start_time` and `end_time` calculations, the `TelemetryService` exposes decorators and context managers that wrap the execution of the LangChain runnables, building a hierarchical execution trace that is returned alongside the final RAG answer.

## Scalability Considerations

- **Horizontal Scaling:** Because the FastAPI backend is completely stateless, it can be horizontally scaled infinitely behind a load balancer (e.g., Google Cloud Run).
- **Vector Search Scaling:** Qdrant Cloud handles scaling the HNSW (Hierarchical Navigable Small World) graph indexes. If the dataset grows massively, Qdrant can be scaled vertically or horizontally independently of the FastAPI backend.
- **LLM Rate Limits:** RAG systems are often bottlenecked by LLM rate limits. The current design mitigates this by using Groq for ultra-fast generation and Gemini for embeddings, distributing API load across providers.

## Cross-References
- To see the visual layout of these components, view [architecture.md](architecture.md).
- To understand why specific technologies were chosen, view [design-decisions.md](design-decisions.md).
