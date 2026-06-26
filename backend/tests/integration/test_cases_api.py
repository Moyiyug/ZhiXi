from io import BytesIO

from fastapi.testclient import TestClient
from sqlmodel import Session, select


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


def test_import_csv_skips_existing_case_code(client: TestClient):
    row = [
        "CSV-001",
        "重复导入案例",
        "要求信息公开",
        "4级",
        "24小时内",
        "4",
        "信息公开型",
        *[""] * 17,
        "这是一个用于测试 CSV 重复导入去重的事件核心描述。",
        "公开说明事实进展并持续更新后续处置。",
        "测试备注",
    ]
    csv_content = "\n".join(["meta", "meta", "meta", ",".join(row)]).encode()

    files = {"file": ("cases.csv", BytesIO(csv_content), "text/csv")}
    first = client.post("/api/cases/import-csv", files=files)
    assert first.status_code == 200
    assert first.json()["imported"] == 1

    files = {"file": ("cases.csv", BytesIO(csv_content), "text/csv")}
    second = client.post("/api/cases/import-csv", files=files)
    assert second.status_code == 200
    assert second.json()["imported"] == 0
    assert second.json()["skipped"] == 1


def test_generate_embedding_replaces_existing_vector(client: TestClient):
    r = client.post("/api/cases", json={
        "title": "向量替换测试", "domain": "其他",
        "public_demands": ["要求信息公开"], "heat_level": 3,
        "strategy_types": ["信息公开型"],
        "event_description": "这个案例用于测试重复生成向量时不会留下重复记录。",
        "strategy_text": "发布阶段性说明并持续更新处置进展。",
    })
    case_id = r.json()["id"]

    assert client.post(f"/api/cases/{case_id}/embedding").status_code == 200
    assert client.post(f"/api/cases/{case_id}/embedding").status_code == 200

    from app.db.session import engine
    from app.models.case import CaseEmbedding

    with Session(engine) as session:
        embeddings = session.exec(select(CaseEmbedding).where(CaseEmbedding.case_id == case_id)).all()
    assert len(embeddings) == 1


def test_generate_embedding_404(client: TestClient):
    r = client.post("/api/cases/99999/embedding")
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


def test_create_case_requires_core_fields(client: TestClient):
    r = client.post("/api/cases", json={
        "title": "缺字段测试", "domain": "其他",
        "public_demands": [], "heat_level": 3,
        "strategy_types": [],
        "event_description": "",
        "strategy_text": "",
    })
    assert r.status_code == 422


def test_invalid_page(client: TestClient):
    r = client.get("/api/cases?page=0")
    assert r.status_code == 422
