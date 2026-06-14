# Performance Optimization

This document outlines how latency and retrieval quality are measured and optimized in `source-stream`.

**Question:** How can latency and retrieval quality be optimized?

## Latency Bottlenecks

In a standard RAG pipeline, the vast majority of execution time is spent waiting on external network I/O.
1. **Embedding Generation:** (~150ms)
2. **Vector DB Search:** (~50-100ms)
3. **LLM Generation:** (~1000ms+)

### Optimizing LLM Generation
Because the LLM is the slowest component, `source-stream` uses **Groq** for synthesis. Groq's hardware (LPUs) delivers generation speeds often exceeding 300 tokens per second. This allows us to inject additional LLM calls (like Guardrails) without exceeding acceptable user-facing latency.

## Retrieval Quality (Tuning)

If the system returns inaccurate answers, it is almost always a retrieval failure, not an LLM failure.

### 1. Chunk Strategy
- **Size:** Large chunks (1000+ chars) provide more context to the LLM but dilute the semantic density, making vector searches less accurate. Small chunks (200 chars) are highly searchable but lack surrounding context.
- **Overlap:** We use a 200-character overlap to ensure sentences aren't cleanly cut in half, which would destroy semantic meaning.

### 2. The `K` Value
- The number of documents retrieved (`k`) is a critical tuning lever. 
- Higher `k` = Better chance of finding the answer, but higher token cost, higher latency, and higher risk of distracting the LLM with irrelevant data ("Lost in the Middle" phenomenon).

## Observability

To actively optimize performance, utilize the DevTool UI. The `Execution Trace` panel breaks down exact millisecond latencies for each stage. If `Query Analysis` takes 800ms, the developer instantly knows the Groq API is experiencing degraded performance.

## Cross-References
- To understand how to test performance changes, see [testing.md](testing.md).
- To view how these metrics are tracked in code, see [telemetry.md](telemetry.md).
