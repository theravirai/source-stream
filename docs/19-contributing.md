# Contributing

This document outlines how to contribute to the `source-stream` codebase while maintaining its strict engineering standards.

**Question:** How can engineers contribute to this codebase?

## 1. Branching & Commits

- **Conventional Commits:** We enforce strict conventional commit messages (e.g., `feat: add hybrid search`, `fix: resolve Qdrant timeout`). This builds a readable history.
- **Single Responsibility:** Commits should represent exactly one independently working unit of functionality. Do not bundle backend database schema changes with unrelated React component updates.

## 2. Architectural Rules

When adding new features, you must adhere to the core architectural principles:
- **Decoupling:** Do not merge pipeline stages. The Document Loader should *only* load. The Text Splitter should *only* split. 
- **LangChain Abstractions:** Before writing custom chunking or retrieval code, check if an official LangChain abstraction exists (e.g., `langchain-core` retrievers). Only implement custom abstractions if the official ones cannot satisfy the requirement.
- **State Management:** The backend must remain stateless. Do not introduce in-memory dicts or sessions to track user progress. Pass state via the API.

## 3. Pull Request Checklist

Before submitting a Pull Request, ensure:
1. **Tests Pass:** All backend `pytest` unit tests pass.
2. **Eval Verification:** If your change modifies retrieval, chunking, or prompt injection, you must run the `eval/run_eval.py` script. The PR description must explicitly state the before and after `Recall@K` scores. PRs that drop the Recall score will be rejected.
3. **Telemetry Inclusion:** If you add a new heavy operation (like an external API call), wrap it in the `TelemetryService` so it appears in the DevTool execution trace.
4. **Documentation:** Update the relevant engineering markdown files in `docs/` if architectural boundaries have shifted.

## Cross-References
- To review the architectural rules in depth, see [04-system-design.md](04-system-design.md) and [03-architecture.md](03-architecture.md).
