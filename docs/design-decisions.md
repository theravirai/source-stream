# Design Decisions

This document outlines the core technology choices for `source-stream` and explains the engineering rationale behind them.

**Question:** Why were these specific technologies chosen?

## Backend Framework: FastAPI

**Why FastAPI?**
- **Asynchronous by Default:** RAG applications are heavily I/O bound (waiting for LLMs, Vector DBs, and scraping). FastAPI's native `async`/`await` support ensures high concurrency and low latency without thread blocking.
- **Pydantic Validation:** Strict type enforcement on API requests and responses ensures that telemetry payloads, configuration parameters, and LLM schemas are validated before they hit the core logic.
- **Developer Velocity:** Automatic OpenAPI documentation allows rapid iteration and testing of the ingestion pipeline.

## Frontend Framework: Vite + React + Tailwind CSS

**Why Vite + React?**
- **State Complexity:** A RAG devtool requires complex state management (pipeline progression, telemetry drawers, active citations). React's component-based state makes this manageable.
- **Build Performance:** Vite provides sub-second HMR and significantly faster build times compared to CRA or Webpack, improving developer experience.
- **Why Tailwind CSS?** Utility-first CSS allows for rapid, consistent styling of complex UI elements (like the split-pane diagnostics drawer) without context switching or managing large stylesheets.

## Language Model Orchestration: LangChain

**Why LangChain?**
- **Standardized Abstractions:** Instead of writing custom parsers for PDFs, websites, and text files, LangChain provides standardized `DocumentLoader` abstractions.
- **LCEL (LangChain Expression Language):** Provides a declarative way to construct complex chains (e.g., retrieval + prompt + LLM) that inherently support streaming and parallel execution.
- **Portability:** LangChain makes it trivial to swap out the underlying LLM (e.g., moving from Groq to OpenAI) or Vector DB without rewriting the core business logic.

## Vector Database: Qdrant Cloud

**Why Qdrant?**
- **Performance & Rust:** Built in Rust, offering extremely fast vector similarity search.
- **Payload Filtering:** Qdrant supports complex metadata filtering, which is critical when we need to filter chunks by source document or URL before performing similarity search.
- **Serverless Cloud:** Removes the operational burden of managing a local vector database instance in production.

## Language Model: Groq API

**Why Groq?**
- **Extreme Low-Latency:** Groq utilizes LPU (Language Processing Unit) inference engines, providing unparalleled token generation speed. This is crucial for RAG, where the user must wait for both retrieval *and* generation.

## Embeddings: Google Gemini

**Why Gemini (`models/gemini-embedding-001`)?**
- **High Dimensionality:** Provides high-quality, 768-dimensional embeddings suitable for capturing deep semantic meaning in varied text sources.
- **Cost & Rate Limits:** Generous free-tier API quotas allow for continuous testing and development without immediate cost concerns.

## Package Management: `uv`

**Why `uv`?**
- **Speed:** Rust-based Python package manager that resolves and installs dependencies magnitudes faster than standard `pip`.
- **Reproducibility:** Excellent lockfile (`pyproject.toml` -> `requirements.txt`) generation ensures deterministic builds in the Docker container.

## Cross-References
- For how these components fit together, see [architecture.md](architecture.md) and [system-design.md](system-design.md).
