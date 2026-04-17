from pydantic import BaseModel, Field
from typing import List, Dict, Any

class QueryRequest(BaseModel):
    query: str = Field(..., description="The query to ask the RAG model")
    k: int = Field(4, ge=1, le=20, description="The number of documents to retrieve for context")

class SourceDocument(BaseModel):
    page_content: str
    metadata: Dict[str, Any]
    score: float

class QueryResponse(BaseModel):
    query: str
    answer: str
    source_documents: List[SourceDocument]
