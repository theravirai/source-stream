from langchain_community.document_loaders import PyPDFLoader
from langchain_core.documents import Document

class PDFLoaderService:
    @staticmethod
    def load(file_path: str) -> list[Document]:
        """Loads a PDF file using LangChain PyPDFLoader and returns a list of Documents."""
        loader = PyPDFLoader(file_path)
        return loader.load()
