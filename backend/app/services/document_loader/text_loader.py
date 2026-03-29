from langchain_community.document_loaders import TextLoader
from langchain_core.documents import Document

class TextLoaderService:
    @staticmethod
    def load(file_path: str) -> list[Document]:
        """Loads a text file using LangChain TextLoader and returns a list of Documents."""
        loader = TextLoader(file_path, encoding="utf-8")
        return loader.load()
