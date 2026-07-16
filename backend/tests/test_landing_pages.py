"""Tests for landing page API endpoints."""

import pytest


def test_health_check(client):
    """Basic health check to verify test setup."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200


def test_list_landing_pages_empty(client):
    """List landing pages when none exist."""
    response = client.get("/api/v1/landing-pages/project/test-project")
    assert response.status_code == 200
    assert response.json() == []


def test_create_landing_page(client):
    """Create a new landing page."""
    response = client.post(
        "/api/v1/landing-pages/",
        json={
            "project_id": "test-project",
            "name": "Test Landing Page",
            "content": {
                "title": "Test",
                "hero": {"headline": "Hello", "subheadline": "World", "primaryCta": "Click"},
            },
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Landing Page"
    assert data["projectId"] == "test-project"
    assert data["status"] == "draft"
    assert data["currentVersion"] == 1
    assert "id" in data


def test_create_and_get_landing_page(client):
    """Create and retrieve a landing page."""
    create_resp = client.post(
        "/api/v1/landing-pages/",
        json={"project_id": "p1", "name": "My Page"},
    )
    lp_id = create_resp.json()["id"]

    get_resp = client.get(f"/api/v1/landing-pages/{lp_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["name"] == "My Page"


def test_update_landing_page(client):
    """Update a landing page creates a new version."""
    create_resp = client.post(
        "/api/v1/landing-pages/",
        json={"project_id": "p1", "name": "Original"},
    )
    lp_id = create_resp.json()["id"]

    update_resp = client.put(
        f"/api/v1/landing-pages/{lp_id}",
        json={"content": {"title": "Updated"}, "change_summary": "Updated title"},
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["currentVersion"] == 2


def test_list_versions(client):
    """List versions after updates."""
    create_resp = client.post(
        "/api/v1/landing-pages/",
        json={"project_id": "p1", "name": "Versioned"},
    )
    lp_id = create_resp.json()["id"]

    client.put(
        f"/api/v1/landing-pages/{lp_id}",
        json={"content": {"title": "V2"}},
    )

    versions_resp = client.get(f"/api/v1/landing-pages/{lp_id}/versions")
    assert versions_resp.status_code == 200
    versions = versions_resp.json()
    assert len(versions) >= 2


def test_delete_landing_page(client):
    """Delete a landing page."""
    create_resp = client.post(
        "/api/v1/landing-pages/",
        json={"project_id": "p1", "name": "ToDelete"},
    )
    lp_id = create_resp.json()["id"]

    del_resp = client.delete(f"/api/v1/landing-pages/{lp_id}")
    assert del_resp.status_code == 200

    get_resp = client.get(f"/api/v1/landing-pages/{lp_id}")
    assert get_resp.status_code == 404


def test_get_nonexistent_landing_page(client):
    """Get a nonexistent landing page returns 404."""
    response = client.get("/api/v1/landing-pages/nonexistent-id")
    assert response.status_code == 404
