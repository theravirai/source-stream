# Engineering Roadmap

This document outlines the planned architectural improvements for `source-stream`.

**Question:** What improvements are planned?

## Phase 1: Scalability & Tenancy (Next 3 Months)

- **Multi-Tenant Indexing:** 
  - *Goal:* Support multiple concurrent users without cross-pollinating retrieved data.
  - *Implementation:* Transition Qdrant to use payload filtering based on a `user_id` or `session_id` injected into chunk metadata during the embedding phase.
- **Cloud Storage Integration:** 
  - *Goal:* Remove the risk of OOM crashes during large PDF uploads.
  - *Implementation:* Integrate Google Cloud Storage. The frontend uploads files directly via pre-signed URLs, and the backend pulls streams from GCS for chunking.

## Phase 2: Advanced Retrieval (Next 6 Months)

- **Semantic Routing:**
  - *Goal:* Bypass vector searches for conversational or meta-queries.
  - *Implementation:* Introduce a fast local classifier (e.g., zero-shot routing) before the Vector Store call.
- **Hybrid Search & Re-ranking:**
  - *Goal:* Improve Recall@K for specific keyword queries (like exact product names or error codes) which dense vectors often miss.
  - *Implementation:* Upgrade Qdrant queries to combine dense vector search with sparse BM25 keyword search, followed by a Cohere or Cross-Encoder re-ranking step.

## Phase 3: Observability Enhancements (Future)

- **Persistent Telemetry:**
  - *Goal:* Allow engineers to review past traces after the session ends.
  - *Implementation:* Store the `TelemetryState` payload into a logging database (like PostgreSQL or BigQuery) keyed by `trace_id` for historical analysis and dashboarding.

## Cross-References
- To understand why these improvements are necessary, review the [17-limitations.md](17-limitations.md).
