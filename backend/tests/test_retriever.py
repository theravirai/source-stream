import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch
from app.main import app

client = TestClient(app)

def test_retriever_endpoints_validation():
    # Empty query (whitespace)
    response = client.post("/api/v1/retriever/query", json={"query": "   ", "k": 4})
    assert response.status_code == 400
    assert response.json()["detail"] == "Query cannot be empty or contain only whitespace."

    # Missing query parameter
    response = client.post("/api/v1/retriever/query", json={"k": 4})
    assert response.status_code == 422

    # Invalid k parameter (too low)
    response = client.post("/api/v1/retriever/query", json={"query": "test query", "k": 0})
    assert response.status_code == 422

    # Invalid k parameter (too high)
    response = client.post("/api/v1/retriever/query", json={"query": "test query", "k": 21})
    assert response.status_code == 422


@patch("app.services.rag_chain.RAGChainService.query")
def test_query_endpoint_success(mock_rag_query):
    from langchain_core.documents import Document
    
    mock_rag_query.return_value = {
        "query": "what is source-stream?",
        "answer": "Source Stream is a RAG application.",
        "source_documents": [
            Document(page_content="Source Stream is a RAG application.", metadata={"source": "docs.txt", "score": 0.95})
        ]
    }
    
    payload = {
        "query": "what is source-stream?",
        "k": 1
    }
    response = client.post("/api/v1/retriever/query", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    assert data["query"] == "what is source-stream?"
    assert data["answer"] == "Source Stream is a RAG application."
    assert len(data["source_documents"]) == 1
    assert data["source_documents"][0]["page_content"] == "Source Stream is a RAG application."
    assert data["source_documents"][0]["score"] == 0.95
    assert data["source_documents"][0]["metadata"]["source"] == "docs.txt"
    mock_rag_query.assert_called_once_with(query="what is source-stream?", k=1)
