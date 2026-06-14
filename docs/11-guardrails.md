# Guardrails & Safety

This document outlines the safety layer of `source-stream`.

**Question:** How does the application prevent malicious inputs and unreliable responses?

## The Need for Guardrails

Language models are susceptible to prompt injection (jailbreaking) and hallucination (confidently asserting false information). Because a RAG system retrieves external data and synthesizes it, the risk of hallucinations is particularly high if the LLM ignores the retrieved context.

To combat this, `source-stream` employs an **LLM-as-a-judge** pattern via a dedicated `GuardrailsService`.

## Input Guardrails (Pre-Retrieval)

Before a query is sent to the Vector Store or the RAG core, it is evaluated by the Guardrails service.

1. **Evaluation:** The service instructs a fast, lightweight LLM (Groq) to classify the user's query as either `SAFE` or `UNSAFE`.
2. **Criteria:** It checks for prompt injection (e.g., "Ignore all previous instructions"), toxic content, or requests that are entirely out of scope for a document retrieval system.
3. **Action:** If flagged as `UNSAFE`, the system throws an exception immediately, halting the pipeline and returning a standard fallback message to the user. No retrieval or synthesis is performed.

## Output Guardrails (Post-Generation)

After the RAG chain generates an answer based on the retrieved context, the output is evaluated *before* it is returned to the client.

1. **Evaluation:** The service passes the generated answer and the original retrieved context to the judge LLM.
2. **Criteria:** The judge must determine if the answer is completely grounded in the context. If the answer contains facts, figures, or claims not present in the provided chunks, it is flagged as a hallucination.
3. **Action:** If flagged as a hallucination, the system intercepts the response, suppresses the hallucinated text, and returns a safe fallback message indicating that a reliable answer could not be synthesized from the documents.

## Architectural Tradeoffs

Running LLM-as-a-judge adds latency to the overall request (one call before retrieval, one call after generation). This is why Groq is utilized; its ultra-low latency inference ensures that these two additional LLM calls add less than 500ms of overhead, maintaining a snappy user experience while enforcing strict safety.

## Cross-References
- To see how the guardrails fit into the overall data flow, refer to [07-retrieval-pipeline.md](07-retrieval-pipeline.md).
