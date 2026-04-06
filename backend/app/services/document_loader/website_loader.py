from langchain_community.document_loaders import RecursiveUrlLoader
from langchain_core.documents import Document
from bs4 import BeautifulSoup

class WebsiteLoaderService:
    @staticmethod
    def load(url: str, max_depth: int = 2) -> list[Document]:
        """Loads a documentation website using RecursiveUrlLoader and returns a list of Documents."""
        def extractor(html: str) -> str:
            soup = BeautifulSoup(html, "html.parser")
            for tag in soup(["script", "style", "nav", "footer", "header"]):
                tag.decompose()
            return soup.get_text(separator="\n").strip()

        if not (url.startswith("http://") or url.startswith("https://")):
            raise ValueError("URL must start with http:// or https://")

        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        loader = RecursiveUrlLoader(
            url=url,
            max_depth=max_depth,
            extractor=extractor,
            prevent_outside=True,
            headers=headers
        )
        return loader.load()
