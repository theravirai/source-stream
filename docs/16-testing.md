# Testing & Evaluations

This document details how we verify the accuracy and stability of `source-stream`.

**Question:** How do we verify the system's accuracy and stability?

## 1. Unit & Integration Testing (Pytest)

The core logic of the FastAPI backend is tested using standard `pytest` suites.
- **Service Mocks:** When testing services like the `GuardrailsService` or `TextSplitterService`, external dependencies (like Groq API calls) are mocked to ensure deterministic, fast CI/CD runs.
- **Endpoint Tests:** We use FastAPI's `TestClient` to verify that API routes return the expected Pydantic schemas and handle malformed input gracefully.

## 2. Retrieval Evaluations (Recall@K)

Unit tests cannot verify if the RAG application is actually *good* at answering questions. For that, we use an evaluation framework.

### The Problem
If the vector store retrieves the wrong chunks, the LLM cannot answer the question. This is measured by **Recall@K** (Does the correct context chunk appear in the top K retrieved chunks?).

### The Eval Script
`source-stream` includes a dedicated `eval/` directory.
1. `eval_questions.json` contains a golden dataset of query-context pairs.
2. `run_eval.py` executes these queries against the running vector store.
3. It compares the retrieved `source` metadata against the expected source and calculates the Recall@K metric.

If an architectural change (e.g., swapping Gemini embeddings for OpenAI embeddings, or changing the chunk size from 1000 to 500) lowers the Recall score on the eval set, the change should be rejected.

## 3. Frontend Validation

The React frontend relies on component-level testing for complex logic (like parsing the telemetry payload) and end-to-end tests (via Playwright or Cypress) to ensure that the document ingestion workflow UI behaves correctly when simulating user clicks.

## Cross-References
- To understand how to optimize the retrieval based on eval results, see [15-performance.md](15-performance.md).
