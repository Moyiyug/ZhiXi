from fastapi.testclient import TestClient

EVENT_TEXT = (
    "某高校食堂被曝食品卫生问题，学生在社交平台发布图片后引发大量转发，"
    "评论区集中要求学校公开调查结果并追责相关负责人。"
    "学校目前尚未发布正式通报，校内学生情绪较为集中。"
)


def _build_report(client: TestClient):
    """Helper: create profile + evidence + report."""
    pr = client.post("/api/events/profile", json={"event_text": EVENT_TEXT}).json()
    ep = client.post("/api/rag/evidence-pack", json={
        "event_text": EVENT_TEXT, "profile": pr, "top_k": 3,
    }).json()
    r = client.post("/api/reports", json={
        "input_event_text": EVENT_TEXT,
        "profile": pr,
        "evidence_pack": ep,
        "generate_now": True,
    })
    return r


def test_create_report(client: TestClient):
    r = _build_report(client)
    assert r.status_code == 201
    data = r.json()
    assert len(data["segments"]) == 3
    for seg in data["segments"]:
        assert seg["generation_status"] == "ready"
        assert len(seg["content_md"]) > 0


def test_get_report_404(client: TestClient):
    r = client.get("/api/reports/99999")
    assert r.status_code == 404


def test_delete_report(client: TestClient):
    r = _build_report(client)
    report_id = r.json()["id"]
    r2 = client.delete(f"/api/reports/{report_id}")
    assert r2.status_code == 204

    r3 = client.get(f"/api/reports/{report_id}")
    assert r3.status_code == 404


def test_regenerate_segment(client: TestClient):
    r = _build_report(client)
    report_id = r.json()["id"]
    seg1_before = r.json()["segments"][0]["content_md"]
    r2 = client.post(f"/api/reports/{report_id}/segments/strategy_and_speech/regenerate")
    assert r2.status_code == 200
    data = r2.json()
    # Segment 2 should have regenerated_count >= 1
    assert data["segments"][1]["regenerated_count"] >= 1
    # Segment 1 unchanged
    assert data["segments"][0]["content_md"] == seg1_before


def test_invalid_segment_key(client: TestClient):
    r = _build_report(client)
    report_id = r.json()["id"]
    r2 = client.post(f"/api/reports/{report_id}/segments/bad_key/regenerate")
    assert r2.status_code == 404


def test_export_markdown(client: TestClient):
    r = _build_report(client)
    report_id = r.json()["id"]
    r2 = client.get(f"/api/reports/{report_id}/export.md")
    assert r2.status_code == 200
    md = r2.text
    assert "舆情画像" in md
    assert "处置结论" in md
    assert "免责声明" in md


def test_report_has_three_titles(client: TestClient):
    r = _build_report(client)
    report_id = r.json()["id"]
    r2 = client.get(f"/api/reports/{report_id}/export.md")
    md = r2.text
    assert "一、舆情画像与历史案例参考" in md
    assert "二、处置结论与回应话术" in md
    assert "三、免责声明与使用边界" in md
    assert md.count("一、舆情画像与历史案例参考") == 1
    assert md.count("二、处置结论与回应话术") == 1
    assert md.count("三、免责声明与使用边界") == 1


def test_report_no_forbidden_terms(client: TestClient):
    r = _build_report(client)
    report_id = r.json()["id"]
    r2 = client.get(f"/api/reports/{report_id}/export.md")
    md = r2.text
    forbidden = ["全网监测", "PSM", "DID", "传播路径分析", "社交网络拓扑"]
    for term in forbidden:
        assert term not in md, f"Forbidden term '{term}' found in report"
