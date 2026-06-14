# Query Routing & Fallbacks

This document outlines how `source-stream` handles queries that cannot be answered by the vector store.

**Question:** How does the system determine whether to answer from context or fallback?

## Semantic Disconnect

In a traditional RAG application, the vector store will *always* return the top `K` most mathematically similar chunks to a query, even if the query is completely unrelated to the dataset.

If a user asks "What is the capital of France?" against a codebase index, Qdrant will still return 4 chunks. If we naively pass those chunks to the LLM, one of two things happens:
1. The LLM hallucinates a connection.
2. The LLM ignores the context and answers from its internal training weights.

To prevent this, `source-stream` employs **Dynamic Relevance Routing**.

## The Routing Mechanism

We instruct the LLM explicitly in the prompt to act as a router.

If the provided chunks do not contain the answer, the LLM is instructed to output a specific deterministic string (e.g., `"I cannot answer this question based on the provided context."`).

When the backend parses this deterministic response, it executes a routing branch:
1. It returns the safe fallback string to the user.
2. It strips the document chunks from the `source_documents` array in the API response.
3. It moves those chunks to a `retrieved_candidates` array in the API response.

## Why this Architecture?

By moving irrelevant chunks to `retrieved_candidates`, the frontend UI knows *not* to render them as trusted citations. However, because they are still returned in the JSON payload, developers can inspect the `retrieved_candidates` in the diagnostics drawer to debug *why* the vector search fetched them in the first place.

## Cross-References
- To see the prompt instructions that force this routing, refer to [09-prompt-construction.md](09-prompt-construction.md).
- To view how this flows end-to-end, refer to [07-retrieval-pipeline.md](07-retrieval-pipeline.md).
