# Prompt Construction

This document details how retrieved context is structured and injected into the LLM prompt.

**Question:** How is context injected into the LLM reliably?

## The Problem of Context Injection

In RAG, the LLM only knows what it is told in the prompt. If retrieved chunks are concatenated randomly, the LLM may fail to distinguish between different source documents, leading to muddy, inaccurate answers.

## The Structured Prompt Template

`source-stream` uses LangChain's `ChatPromptTemplate` to enforce a strict, parseable structure for the LLM. 

```python
template = """You are a helpful and precise assistant.
Answer the user's question based ONLY on the provided context.

If the answer cannot be found in the context, you must output exactly:
"I cannot answer this question based on the provided context."
Do not attempt to guess or use outside knowledge.

Context:
{context}

Question:
{question}
"""
```

## Context Formatting (LCEL)

Before the prompt is sent, the retrieved `Document` objects must be serialized into the `{context}` variable.
We utilize LangChain Expression Language (LCEL) to map the chunks into a readable string:

```python
def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)
```

During the LCEL chain execution (`{"context": retriever | format_docs, "question": RunnablePassthrough()}`), this function dynamically unpacks the retrieved chunks, separates them with clear newline boundaries, and injects them into the template.

## Strict Boundaries

By placing the `{context}` block clearly separate from the `{question}` block, we reduce the risk of the LLM confusing the retrieved text with the user's instructions. This reduces the surface area for indirect prompt injections, where malicious text inside a retrieved PDF might otherwise command the LLM.

## Cross-References
- To see how the system handles the fallback string, refer to [query-routing.md](query-routing.md).
- To see the full LCEL chain execution, refer to [retrieval-pipeline.md](retrieval-pipeline.md).
