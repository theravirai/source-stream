from pydantic import BaseModel, Field

class DocumentResponse(BaseModel):
    page_content: str
    metadata: dict

class WebsiteLoadRequest(BaseModel):
    url: str = Field(..., description="The URL of the website to crawl.")
    max_depth: int = Field(2, ge=1, le=5, description="Maximum crawl depth.")
