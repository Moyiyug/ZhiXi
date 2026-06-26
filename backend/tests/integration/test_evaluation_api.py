from fastapi.testclient import TestClient


def test_evaluation_accepts_focus_options(client: TestClient):
    r = client.post(
        "/api/evaluation/run-demo",
        json={
            "demo_event_id": "golden_event_1",
            "top_k": 3,
            "focus_options": ["回应窗口", "补救举措"],
        },
    )

    assert r.status_code == 200
    data = r.json()
    assert data["event_id"] == "golden_event_1"
    assert data["metrics"]["focus_options"] == ["回应窗口", "补救举措"]
