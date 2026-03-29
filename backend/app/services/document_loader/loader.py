from langchain_core.documents import Document
from app.services.document_loader.text_loader import TextLoaderService
from app.services.document_loader.pdf_loader import PDFLoaderService
from app.services.document_loader.website_loader import WebsiteLoaderService

class DocumentLoaderService:
    @staticmethod
    def load_text(file_path: str) -> list[Document]:
        """Load local text files."""
        return TextLoaderService.load(file_path)

    @staticmethod
    def load_pdf(file_path: str) -> list[Document]:
        """Load local PDF documents."""
        return PDFLoaderService.load(file_path)

    @staticmethod
    def load_website(url: str, max_depth: int = 2) -> list[Document]:
        """Load documentation websites."""
        return WebsiteLoaderService.load(url, max_depth)
