import os
from datetime import datetime

import httpx
from anthropic import Anthropic
from bs4 import BeautifulSoup
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from notion_client import Client as NotionClient
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="NoteOrganizer API")

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize clients
anthropic_client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


class LinkRequest(BaseModel):
    url: str


class NoteRequest(BaseModel):
    content: str


class SummaryResponse(BaseModel):
    title: str
    summary: str
    key_takeaways: list[str]
    source_url: str | None = None


class NotionSaveRequest(BaseModel):
    title: str
    summary: str
    key_takeaways: list[str]
    source_url: str


class NotionSaveResponse(BaseModel):
    success: bool
    notion_url: str | None = None


async def scrape_article(url: str) -> tuple[str, str]:
    """Fetch and extract article content from a URL."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
    }

    async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
        response = await client.get(url, headers=headers)
        response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")

    # Remove script and style elements
    for element in soup(["script", "style", "nav", "footer", "header", "aside"]):
        element.decompose()

    # Try to extract title
    title = ""
    if soup.title:
        title = soup.title.string or ""
    if not title:
        h1 = soup.find("h1")
        if h1:
            title = h1.get_text(strip=True)

    # Try common article content selectors
    content = ""
    article_selectors = [
        "article",
        '[role="main"]',
        ".article-content",
        ".post-content",
        ".entry-content",
        ".content",
        "main",
    ]

    for selector in article_selectors:
        article = soup.select_one(selector)
        if article:
            content = article.get_text(separator="\n", strip=True)
            break

    # Fallback to body if no article found
    if not content:
        body = soup.find("body")
        if body:
            content = body.get_text(separator="\n", strip=True)

    # Clean up content - remove excessive whitespace
    lines = [line.strip() for line in content.split("\n") if line.strip()]
    content = "\n".join(lines)

    # Truncate if too long (Claude has context limits)
    if len(content) > 15000:
        content = content[:15000] + "..."

    return title.strip(), content


def summarize_with_claude(title: str, content: str) -> tuple[str, list[str]]:
    """Use Claude to generate a summary and key takeaways."""
    prompt = f"""Please analyze the following article and provide:
1. A concise summary (2-3 paragraphs)
2. 3-5 key takeaways as bullet points

Article Title: {title}

Article Content:
{content}

Respond in the following format:
SUMMARY:
[Your summary here]

KEY TAKEAWAYS:
- [Takeaway 1]
- [Takeaway 2]
- [Takeaway 3]
"""

    message = anthropic_client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}]
    )

    response_text = message.content[0].text

    # Parse the response
    summary = ""
    takeaways = []

    if "SUMMARY:" in response_text and "KEY TAKEAWAYS:" in response_text:
        parts = response_text.split("KEY TAKEAWAYS:")
        summary_part = parts[0].replace("SUMMARY:", "").strip()
        takeaways_part = parts[1].strip()

        summary = summary_part

        # Parse takeaways
        for line in takeaways_part.split("\n"):
            line = line.strip()
            if line.startswith("-"):
                takeaways.append(line[1:].strip())
            elif line.startswith("•"):
                takeaways.append(line[1:].strip())
    else:
        # Fallback: use entire response as summary
        summary = response_text

    return summary, takeaways


@app.get("/health")
async def health_check():
    return {"status": "ok"}


@app.post("/summarize/link", response_model=SummaryResponse)
async def summarize_link(request: LinkRequest):
    """Extract content from a link and generate a summary."""
    try:
        title, content = await scrape_article(request.url)

        if not content:
            raise HTTPException(status_code=400, detail="Could not extract content from URL")

        summary, takeaways = summarize_with_claude(title, content)

        return SummaryResponse(
            title=title or "Untitled Article",
            summary=summary,
            key_takeaways=takeaways,
            source_url=request.url
        )
    except httpx.HTTPError as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch URL: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing article: {str(e)}")


@app.post("/summarize/note", response_model=SummaryResponse)
async def summarize_note(request: NoteRequest):
    """Generate a summary from note content."""
    try:
        summary, takeaways = summarize_with_claude("Note", request.content)

        return SummaryResponse(
            title="Note Summary",
            summary=summary,
            key_takeaways=takeaways
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error summarizing note: {str(e)}")


@app.post("/save-to-notion", response_model=NotionSaveResponse)
async def save_to_notion(request: NotionSaveRequest):
    """Save a summary to a Notion database."""
    notion_api_key = os.getenv("NOTION_API_KEY")
    database_id = os.getenv("NOTION_DATABASE_ID")

    if not notion_api_key or not database_id:
        raise HTTPException(
            status_code=500,
            detail="Notion API key or database ID not configured"
        )

    try:
        notion = NotionClient(auth=notion_api_key)

        # Build the key takeaways as bulleted list blocks
        children_blocks = [
            {
                "object": "block",
                "type": "heading_2",
                "heading_2": {
                    "rich_text": [{"type": "text", "text": {"content": "Summary"}}]
                }
            },
            {
                "object": "block",
                "type": "paragraph",
                "paragraph": {
                    "rich_text": [{"type": "text", "text": {"content": request.summary}}]
                }
            },
            {
                "object": "block",
                "type": "heading_2",
                "heading_2": {
                    "rich_text": [{"type": "text", "text": {"content": "Key Takeaways"}}]
                }
            }
        ]

        # Add each takeaway as a bulleted list item
        for takeaway in request.key_takeaways:
            children_blocks.append({
                "object": "block",
                "type": "bulleted_list_item",
                "bulleted_list_item": {
                    "rich_text": [{"type": "text", "text": {"content": takeaway}}]
                }
            })

        # Create the page in Notion
        new_page = notion.pages.create(
            parent={"database_id": database_id},
            properties={
                "Title": {
                    "title": [{"text": {"content": request.title}}]
                },
                "Summary": {
                    "rich_text": [{"text": {"content": request.summary[:2000]}}]  # Notion limit
                },
                "Source URL": {
                    "url": request.source_url
                },
                "Date": {
                    "date": {"start": datetime.now().isoformat()[:10]}
                }
            },
            children=children_blocks
        )

        return NotionSaveResponse(
            success=True,
            notion_url=new_page.get("url")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save to Notion: {str(e)}")
