from pydantic import BaseModel, Field, model_validator
from app.models.document_loader import DocumentResponse

class SplitRequest(BaseModel):
    documents: list[DocumentResponse] = Field(..., description="List of documents to split.")
    chunk_size: int = Field(1000, ge=100, le=10000, description="The maximum size of each chunk in characters.")
    chunk_overlap: int = Field(200, ge=0, description="The character overlap between consecutive chunks.")

    @model_validator(mode="after")
    def validate_overlap(self) -> "SplitRequest":
        if self.chunk_overlap >= self.chunk_size:
            raise ValueError("chunk_overlap must be strictly less than chunk_size")
        return self
