import pytest
import pytest_asyncio
from app.services.query_router import QueryRouterService

@pytest.mark.asyncio
async def test_query_router_factual():
    query = "What is LangChain?"
    intent = await QueryRouterService.analyze_intent(query)
    assert intent.requires_retrieval is True
    assert intent.reason

@pytest.mark.asyncio
async def test_query_router_conversational():
    query = "Can you help me?"
    intent = await QueryRouterService.analyze_intent(query)
    assert intent.requires_retrieval is False
    assert intent.reason
