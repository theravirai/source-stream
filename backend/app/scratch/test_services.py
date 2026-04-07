import sys
import os

# Adjust sys.path to find 'app'
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from app.core.config import settings
from app.services.embeddings import get_embeddings_service
from app.services.vectorstore import VectorStoreService

print("Testing services initialization...")

# Print configuration status
print(f"GEMINI_API_KEY set: {bool(settings.GEMINI_API_KEY)}")
print(f"QDRANT_URL set: {settings.QDRANT_URL}")
print(f"QDRANT_API_KEY set: {bool(settings.QDRANT_API_KEY)}")

try:
    print("Testing embeddings service instantiation...")
    embeddings = get_embeddings_service()
    print("Embeddings service instantiated successfully!")
except ValueError as e:
    print(f"Embeddings service correctly failed with ValueError (expected if API key missing): {e}")

try:
    print("Testing vector store service instantiation...")
    vector_store = VectorStoreService.get_vector_store()
    print("Vector store service instantiated successfully!")
except ValueError as e:
    print(f"Vector store service correctly failed with ValueError (expected if URL/API key missing): {e}")
except Exception as e:
    print(f"Vector store failed with other exception: {type(e).__name__}: {e}")

print("Service tests complete.")
