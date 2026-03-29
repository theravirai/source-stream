from fastapi.testclient import TestClient
from app.main import app
from unittest.mock import patch
from langchain_core.documents import Document
import pytest

client = TestClient(app)

def test_load_text_file_success():
    # Test text upload and loading with mocked service
    test_docs = [Document(page_content="Mocked text content", metadata={"source": "test.txt"})]
    
    with patch("app.api.routes.document_loader.DocumentLoaderService.load_text", return_value=test_docs) as mock_load:
        files = {"file": ("test.txt", "Mocked text content", "text/plain")}
        response = client.post("/api/v1/document-loader/text", files=files)
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["page_content"] == "Mocked text content"
        assert data[0]["metadata"]["source"] == "test.txt"
        mock_load.assert_called_once()

def test_load_text_file_invalid_extension():
    files = {"file": ("test.pdf", "Dummy pdf data", "application/pdf")}
    response = client.post("/api/v1/document-loader/text", files=files)
    assert response.status_code == 400
    assert "Only .txt files are supported" in response.json()["detail"]

def test_load_pdf_file_success():
    test_docs = [Document(page_content="Mocked PDF content", metadata={"source": "test.pdf", "page": 1})]
    
    with patch("app.api.routes.document_loader.DocumentLoaderService.load_pdf", return_value=test_docs) as mock_load:
        files = {"file": ("test.pdf", "Mocked pdf content", "application/pdf")}
        response = client.post("/api/v1/document-loader/pdf", files=files)
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["page_content"] == "Mocked PDF content"
        assert data[0]["metadata"]["page"] == 1
        mock_load.assert_called_once()

def test_load_pdf_file_invalid_extension():
    files = {"file": ("test.txt", "Dummy txt data", "text/plain")}
    response = client.post("/api/v1/document-loader/pdf", files=files)
    assert response.status_code == 400
    assert "Only .pdf files are supported" in response.json()["detail"]

def test_load_website_success():
    test_docs = [Document(page_content="Scraped website content", metadata={"source": "https://example.com"})]
    
    with patch("app.api.routes.document_loader.DocumentLoaderService.load_website", return_value=test_docs) as mock_load:
        payload = {"url": "https://example.com", "max_depth": 2}
        response = client.post("/api/v1/document-loader/website", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["page_content"] == "Scraped website content"
        assert data[0]["metadata"]["source"] == "https://example.com"
        mock_load.assert_called_once_with("https://example.com", 2)

def test_load_website_invalid_url():
    # Test validation failure for non-http/https URL
    payload = {"url": "ftp://example.com", "max_depth": 2}
    response = client.post("/api/v1/document-loader/website", json=payload)
    assert response.status_code == 400
    assert "URL must start with http:// or https://" in response.json()["detail"]
