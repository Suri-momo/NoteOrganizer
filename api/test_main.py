import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health_check():
    """Test the health check endpoint returns ok status."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_summarize_link_endpoint_exists():
    """Test the summarize link endpoint accepts POST requests."""
    response = client.post(
        "/summarize/link",
        json={"url": "https://example.com"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert "key_takeaways" in data
    assert isinstance(data["key_takeaways"], list)


def test_summarize_note_endpoint_exists():
    """Test the summarize note endpoint accepts POST requests."""
    response = client.post(
        "/summarize/note",
        json={"content": "This is some test note content."}
    )
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert "key_takeaways" in data
    assert isinstance(data["key_takeaways"], list)


def test_summarize_link_requires_url():
    """Test that summarize link endpoint requires a URL."""
    response = client.post(
        "/summarize/link",
        json={}
    )
    assert response.status_code == 422  # Validation error


def test_summarize_note_requires_content():
    """Test that summarize note endpoint requires content."""
    response = client.post(
        "/summarize/note",
        json={}
    )
    assert response.status_code == 422  # Validation error
