from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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


class LinkRequest(BaseModel):
    url: str


class NoteRequest(BaseModel):
    content: str


class SummaryResponse(BaseModel):
    summary: str
    key_takeaways: list[str]


@app.get("/health")
async def health_check():
    return {"status": "ok"}


@app.post("/summarize/link", response_model=SummaryResponse)
async def summarize_link(request: LinkRequest):
    """Extract content from a link and generate a summary."""
    # TODO: Implement link scraping and summarization
    return SummaryResponse(
        summary="Summary placeholder",
        key_takeaways=["Takeaway 1", "Takeaway 2"]
    )


@app.post("/summarize/note", response_model=SummaryResponse)
async def summarize_note(request: NoteRequest):
    """Generate a summary from note content."""
    # TODO: Implement summarization with LLM
    return SummaryResponse(
        summary="Summary placeholder",
        key_takeaways=["Takeaway 1", "Takeaway 2"]
    )
