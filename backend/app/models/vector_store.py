from pydantic import BaseModel, Field
from app.models.document_loader import DocumentResponse

class IndexRequest(BaseModel):
    documents: list[DocumentResponse] = Field(..., description="List of chunks to index.")

class IndexResponse(BaseModel):
    status: str
    message: str
    indexed_count: int
    collection: str

class SearchRequest(BaseModel):
    query: str = Field(..., description="The query to search for.")
    k: int = Field(4, ge=1, le=20, description="Number of results to return.")

class SearchResultResponse(BaseModel):
    page_content: str
    metadata: dict
    score: float

class VectorStoreStatusResponse(BaseModel):
    collection_name: str
    status: str
    chunks_count: int
    vector_size: int

class VectorStoreClearResponse(BaseModel):
    status: str
    message: str

