# Troubleshooting

This document provides debugging steps for common system failures in `source-stream`.

**Question:** How do we debug common system failures?

## 1. Duplicate Indexing (Chunks Multiplied)

**Symptom:** Querying the Vector Store returns multiple identical chunks, and the `Chunks Count` in the footer is much higher than expected.
**Root Cause:** Re-indexing the same documents without clearing the collection.
**Resolution:** The `VectorStoreService.index_documents` method now inherently calls `clear_collection` before upserting. If testing locally via custom scripts, ensure you hit the `/api/v1/vector-store/clear` endpoint before re-indexing.

## 2. API Rate Limiting

**Symptom:** RAG queries fail with `429 Too Many Requests` in the Execution Trace.
**Root Cause:** Exceeding the free-tier tokens-per-minute (TPM) on Groq or Gemini APIs.
**Resolution:**
- Check the Execution Trace to identify which API (Embeddings vs. Synthesis) failed.
- Reduce `chunk_size` or limit the number of documents uploaded during testing.

## 3. UI Layout Breaking (Large Scrollbars)

**Symptom:** Opening the DevTool diagnostics sidebar causes the entire page to stretch vertically.
**Root Cause:** CSS Flexbox properties (`min-height: auto`) allowing a child element to expand beyond its intended bounds.
**Resolution:** Ensure that the parent container has a strict `max-h-[...]` property, and flex children that handle scrollable data utilize `flex-1 min-h-0` to force containment.

## 4. Qdrant Connection Refused

**Symptom:** `Connection error` when uploading documents.
**Root Cause:** Invalid or missing `QDRANT_URL` / `QDRANT_API_KEY` environment variables.
**Resolution:** Ensure the `.env` file is populated. If running in Docker/Cloud Run, verify the environment variables are successfully mounted to the container at runtime.

## Cross-References
- To understand how the UI telemetry helps identify these errors, see [telemetry.md](telemetry.md).
- To verify correct deployment configurations, see [deployment.md](deployment.md).
