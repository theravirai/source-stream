import pytest
from app.models.document_loader import DocumentResponse
from app.models.text_splitter import SplitRequest
from app.services.text_splitter import TextSplitterService
from pydantic import ValidationError

def test_split_request_validation():
    # Valid request
    req = SplitRequest(
        documents=[DocumentResponse(page_content="hello", metadata={"source": "test"})],
        chunk_size=1000,
        chunk_overlap=200
    )
    assert req.chunk_size == 1000
    assert req.chunk_overlap == 200

    # Invalid overlap >= size
    with pytest.raises(ValidationError):
        SplitRequest(
            documents=[DocumentResponse(page_content="hello", metadata={"source": "test"})],
            chunk_size=500,
            chunk_overlap=500
        )

    # Invalid chunk size <= 0
    with pytest.raises(ValidationError):
        SplitRequest(
            documents=[DocumentResponse(page_content="hello", metadata={"source": "test"})],
            chunk_size=0,
            chunk_overlap=0
        )

def test_text_splitter_service():
    docs = [
        DocumentResponse(
            page_content="This is a long sentence. " * 50,  # about 1250 characters
            metadata={"source": "test.txt"}
        )
    ]
    
    chunks = TextSplitterService.split_documents(docs, chunk_size=500, chunk_overlap=50)
    
    assert len(chunks) > 1
    for i, chunk in enumerate(chunks):
        assert chunk.metadata["source"] == "test.txt"
        assert chunk.metadata["chunk_index"] == i
        assert len(chunk.page_content) <= 500
