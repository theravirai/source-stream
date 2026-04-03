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

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_split_endpoint_success():
    payload = {
        "documents": [
            {"page_content": "This is a sentence that is long enough to split. " * 10, "metadata": {"source": "doc.txt"}}
        ],
        "chunk_size": 150,
        "chunk_overlap": 20
    }
    response = client.post("/api/v1/text-splitter/split", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2
    assert data[0]["metadata"]["source"] == "doc.txt"
    assert "chunk_index" in data[0]["metadata"]

def test_split_endpoint_validation_error():
    # overlap >= size
    payload = {
        "documents": [
            {"page_content": "some text", "metadata": {"source": "doc.txt"}}
        ],
        "chunk_size": 100,
        "chunk_overlap": 100
    }
    response = client.post("/api/v1/text-splitter/split", json=payload)
    assert response.status_code == 422

