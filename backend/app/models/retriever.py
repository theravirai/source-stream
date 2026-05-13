from pydantic import BaseModel, Field
from typing import List, Dict, Any

class QueryRequest(BaseModel):
    query: str = Field(..., description="The query to ask the RAG model")
    k: int = Field(4, ge=1, le=20, description="The number of documents to retrieve for context")

class SourceDocument(BaseModel):
    page_content: str
    metadata: Dict[str, Any]
    score: float

class TelemetryStep(BaseModel):
    name: str
    duration_ms: float
    details: Dict[str, Any] | None = None

class QueryTelemetry(BaseModel):
    total_duration_ms: float
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    steps: List[TelemetryStep]

class QueryResponse(BaseModel):
    query: str
    answer: str
    source_documents: List[SourceDocument]
    retrieved_candidates: List[SourceDocument] = Field(default_factory=list)
    guardrail_blocked: bool = False
    guardrail_reason: str | None = None
    telemetry: QueryTelemetry | None = None
