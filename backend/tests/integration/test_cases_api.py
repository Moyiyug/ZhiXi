import json
from io import BytesIO

from fastapi.testclient import TestClient


def test_create_case(client: TestClient):
    r = client.post("/api/cases", json={
        "title": "测试案例", "domain": "文化传播类",
        "public_demands": ["要求信息公开"], "heat_level": 3,
        "strategy_types": ["行动补救型"],
        "event_description": "这是一个测试案例的描述，用于验证创建功能是否正常。",
        "strategy_text": "采取行动补救措施，发布公开声明。",
    })
    assert r.status_code == 201
    data = r.json()
    assert data["id"] is not None
    assert data["title"] == "测试案例"
    assert data["embedding_status"] == "none"
    assert data["enabled"] is True


def test_list_cases(client: TestClient):
    r = client.get("/api/cases")
    assert r.status_code == 200
    data = r.json()
    assert "items" in data
    assert "total" in data


def test_list_cases_with_filters(client: TestClient):
    r = client.get("/api/cases?domain=文化传播类&page=1&page_size=5")
    assert r.status_code == 200


def test_get_case_404(client: TestClient):
    r = client.get("/api/cases/99999")
    assert r.status_code == 404


def test_update_case_resets_embedding(client: TestClient):
    # Create
    r = client.post("/api/cases", json={
        "title": "编辑测试", "domain": "其他",
        "public_demands": ["要求道歉"], "heat_level": 2,
        "strategy_types": ["快速道歉型"],
        "event_description": "这是一个用来测试编辑功能的案例描述文本。",
        "strategy_text": "快速道歉并发布声明。",
    })
    case_id = r.json()["id"]
    # Update
    r = client.put(f"/api/cases/{case_id}", json={"title": "编辑后标题"})
    assert r.status_code == 200
    assert r.json()["embedding_status"] == "none"


def test_delete_case(client: TestClient):
    r = client.post("/api/cases", json={
        "title": "待删除", "domain": "其他",
        "public_demands": ["要求道歉"], "heat_level": 1,
        "strategy_types": ["快速道歉型"],
        "event_description": "这个案例即将被删除，用于测试删除功能是否正常工作。",
        "strategy_text": "测试删除。",
    })
    case_id = r.json()["id"]
    r = client.delete(f"/api/cases/{case_id}")
    assert r.status_code == 204
    r = client.get(f"/api/cases/{case_id}")
    assert r.status_code == 404


def test_toggle_case(client: TestClient):
    r = client.post("/api/cases", json={
        "title": "切换测试", "domain": "其他",
        "public_demands": ["要求信息公开"], "heat_level": 3,
        "strategy_types": ["信息公开型"],
        "event_description": "这个案例用于测试启用停用切换功能。",
        "strategy_text": "测试切换。",
    })
    case_id = r.json()["id"]
    assert r.json()["enabled"] is True
    r = client.post(f"/api/cases/{case_id}/toggle")
    assert r.json()["enabled"] is False
    r = client.post(f"/api/cases/{case_id}/toggle")
    assert r.json()["enabled"] is True


def test_create_case_invalid_title(client: TestClient):
    r = client.post("/api/cases", json={
        "title": "", "domain": "其他",
        "public_demands": [], "heat_level": 3,
        "strategy_types": [],
        "event_description": "测试", "strategy_text": "测试",
    })
    assert r.status_code == 422


def test_invalid_page(client: TestClient):
    r = client.get("/api/cases?page=0")
    assert r.status_code == 422
