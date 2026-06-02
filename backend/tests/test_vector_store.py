import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch
from app.main import app
from app.models.vector_store import IndexRequest, SearchRequest

client = TestClient(app)

def test_vector_store_endpoints_validation():
    # Empty search query
    response = client.post("/api/v1/vector-store/search", json={}, headers={"X-Session-ID": "test_session"})
    assert response.status_code == 422

    # Empty index documents
    response = client.post("/api/v1/vector-store/index", json={}, headers={"X-Session-ID": "test_session"})
    assert response.status_code == 422

@patch("app.services.vectorstore.VectorStoreService.index_documents")
@patch("app.core.config.settings.QDRANT_COLLECTION", "test_collection")
def test_index_endpoint_success(mock_index_documents):
    mock_index_documents.return_value = 5
    payload = {
        "documents": [
            {"page_content": f"chunk {i}", "metadata": {"source": "test.txt", "chunk_index": i}}
            for i in range(5)
        ]
    }
    response = client.post("/api/v1/vector-store/index", json=payload, headers={"X-Session-ID": "test_session"})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["indexed_count"] == 5
    assert "test_session" in data["collection"]
    mock_index_documents.assert_called_once()

@patch("app.services.vectorstore.VectorStoreService.similarity_search")
def test_search_endpoint_success(mock_similarity_search):
    from langchain_core.documents import Document as LCDocument
    
    mock_similarity_search.return_value = [
        (LCDocument(page_content="chunk 0", metadata={"source": "test.txt"}), 0.95),
        (LCDocument(page_content="chunk 1", metadata={"source": "test.txt"}), 0.88),
    ]
    
    payload = {
        "query": "test query",
        "k": 2
    }
    response = client.post("/api/v1/vector-store/search", json=payload, headers={"X-Session-ID": "test_session"})
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["page_content"] == "chunk 0"
    assert data[0]["score"] == 0.95
    assert data[0]["metadata"]["source"] == "test.txt"
    mock_similarity_search.assert_called_once_with(session_id="test_session", query="test query", k=2)

@patch("app.services.vectorstore.VectorStoreService.get_status")
def test_status_endpoint_success(mock_get_status):
    mock_get_status.return_value = {
        "collection_name": "test_collection",
        "status": "green",
        "chunks_count": 42,
        "vector_size": 1536
    }
    response = client.get("/api/v1/vector-store/status", headers={"X-Session-ID": "test_session"})
    assert response.status_code == 200
    data = response.json()
    assert data["collection_name"] == "test_collection"
    assert data["status"] == "green"
    assert data["chunks_count"] == 42
    assert data["vector_size"] == 1536
    mock_get_status.assert_called_once()

@patch("app.services.vectorstore.VectorStoreService.clear_collection")
def test_clear_endpoint_success(mock_clear_collection):
    mock_clear_collection.return_value = "test_collection"
    response = client.post("/api/v1/vector-store/clear", headers={"X-Session-ID": "test_session"})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "test_collection" in data["message"]
    mock_clear_collection.assert_called_once()

