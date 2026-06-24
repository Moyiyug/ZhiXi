from fastapi.testclient import TestClient


def test_settings_public(client: TestClient):
    r = client.get("/api/settings/public")
    assert r.status_code == 200
    data = r.json()
    assert "mock_mode" in data
    assert "keys" in data
    assert "retrieval" in data
    assert "weights" in data["retrieval"]


def test_settings_no_real_keys(client: TestClient):
    r = client.get("/api/settings/public")
    data = r.json()
    for key_status in data["keys"].values():
        assert key_status in ("configured", "missing")
        # Never return real key values
        assert "sk-" not in str(key_status)
        assert "api-" not in str(key_status)


def test_settings_weights_match(client: TestClient):
    r = client.get("/api/settings/public")
    weights = r.json()["retrieval"]["weights"]
    total = sum(weights.values())
    assert abs(total - 1.0) < 0.01, f"Weights sum to {total}, expected ~1.0"
    assert weights.get("semantic") == 0.45
    assert weights.get("demand") == 0.20
