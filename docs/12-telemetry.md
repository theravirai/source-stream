# Telemetry & Diagnostics

This document outlines how `source-stream` tracks and visualizes the RAG execution process.

**Question:** How is execution measured and visualized in the DevTool?

## The Observability Gap in RAG

A major challenge in RAG architectures is opacity. When a user asks a question and receives an answer, it is difficult to know:
- How long did the vector search take vs. the LLM generation?
- Did the input guardrail trigger?
- How many tokens were consumed?
- How many chunks were actually retrieved?

## The Telemetry Service

To solve this, `source-stream` implements a structural `TelemetryService`. 

During a request, a `TelemetryState` object is initialized. As the request passes through the FastAPI router and down into the Services layer (Guardrails, Vector Store, RAG Chain), each service uses the telemetry singleton to log its execution.

```python
# Example telemetry tracking in a service
def retrieve_documents(query: str):
    telemetry.start_step("Document Search")
    # ... execution ...
    telemetry.end_step("Document Search", status="PASSED", details={"retrieved_chunks": 4})
```

## The Payload Structure

Instead of just logging this to standard output, the `TelemetryState` is serialized and appended to the final API response payload.

```json
{
  "answer": "The capital is Paris.",
  "telemetry": {
    "total_duration_ms": 1240,
    "prompt_tokens": 850,
    "completion_tokens": 120,
    "steps": [
      {
        "name": "Input validation",
        "duration_ms": 150,
        "status": "SAFE"
      },
      {
        "name": "Document Search",
        "duration_ms": 400,
        "status": "PASSED"
      }
    ]
  }
}
```

## Diagnostics Split-Pane UI

The React frontend utilizes a dual-pane diagnostics drawer (DevTool UI) that processes this telemetry object in real-time.

1. **Execution Trace (Top Pane):** Renders the chronological steps of the pipeline, visually exposing latencies, token consumption, and guardrail verdicts.
2. **Citations (Bottom Pane):** Renders the exact source chunks retrieved by Qdrant (including similarity scores), allowing the developer to cross-reference the retrieved data against the LLM's final answer.

This dual-pane design uses CSS flexbox (`flex-1 min-h-0`) to maintain a strict layout, preventing page expansion while providing internal scrolling for large traces.

## Cross-References
- For details on the API response schema that carries the telemetry, see [06-api.md](06-api.md).
- To see how the retrieved chunks are scored, see [08-vector-store.md](08-vector-store.md).
