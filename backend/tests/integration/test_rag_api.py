import json

from fastapi.testclient import TestClient

EVENT_TEXT = (
    "某高校食堂被曝食品卫生问题，学生在社交平台发布图片后引发大量转发，"
    "评论区集中要求学校公开调查结果并追责相关负责人。"
    "学校目前尚未发布正式通报，校内学生情绪较为集中。"
)


def test_generate_profile(client: TestClient):
    r = client.post("/api/events/profile", json={"event_text": EVENT_TEXT})
    assert r.status_code == 200
    data = r.json()
    assert "domain" in data
    assert "public_demands" in data
    assert "heat_level" in data
    assert 1 <= data["heat_level"] <= 5
    assert data["confidence"] > 0
    assert "profile_source" in data


def test_generate_profile_short_text(client: TestClient):
    r = client.post("/api/events/profile", json={"event_text": "短"})
    assert r.status_code == 422


def test_retrieve_empty_when_no_ready_cases(client: TestClient):
    """No cases have ready embeddings in test DB — should return empty."""
    r = client.post("/api/events/profile", json={"event_text": EVENT_TEXT})
    profile = r.json()
    r2 = client.post("/api/rag/retrieve", json={
        "event_text": EVENT_TEXT, "profile": profile, "top_k": 3,
    })
    assert r2.status_code == 200
    data = r2.json()
    assert "query_text" in data
    assert "results" in data
    # No ready embeddings = empty results, but query_text still generated
    assert isinstance(data["results"], list)


def test_evidence_pack(client: TestClient):
    r = client.post("/api/events/profile", json={"event_text": EVENT_TEXT})
    profile = r.json()
    r2 = client.post("/api/rag/evidence-pack", json={
        "event_text": EVENT_TEXT, "profile": profile, "top_k": 3,
    })
    assert r2.status_code == 200
    data = r2.json()
    assert len(data["limitations"]) == 3
    assert "current_event" in data
    assert "query_text" in data
    assert "dictionary_hints" in data
