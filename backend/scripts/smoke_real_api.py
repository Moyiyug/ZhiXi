#!/usr/bin/env python
"""Run a real-provider smoke test for the ZhiXi backend.

The script forces APP_MOCK_MODE=false for this process, uses a temporary
SQLite database, and verifies both embedding and chat generation use real
provider models instead of mock clients.
"""

from __future__ import annotations

import json
import os
import sys
import tempfile
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
os.chdir(BACKEND_ROOT)
sys.path.insert(0, str(BACKEND_ROOT))

temp_dir = tempfile.TemporaryDirectory(prefix="zhixi-real-smoke-")
db_path = Path(temp_dir.name) / "smoke.db"

os.environ["APP_MOCK_MODE"] = "false"
os.environ["APP_DEBUG"] = "false"
os.environ["DATABASE_URL"] = f"sqlite:///{db_path.as_posix()}"


def assert_response_ok(response, label: str) -> dict:
    if response.status_code >= 400:
        raise RuntimeError(f"{label} failed: HTTP {response.status_code} {response.text}")
    return response.json()


def main() -> None:
    try:
        from fastapi.testclient import TestClient

        from app.core.config import settings
        from app.db.seed import DEMO_EVENTS
        from app.main import app

        missing = []
        if not settings.dashscope_api_key:
            missing.append("DASHSCOPE_API_KEY")
        if not settings.deepseek_api_key:
            missing.append("DEEPSEEK_API_KEY")
        if missing:
            raise RuntimeError(f"Missing required real API keys in backend/.env: {', '.join(missing)}")
        if settings.app_mock_mode:
            raise RuntimeError("APP_MOCK_MODE is still true; real API smoke must run with mock mode disabled.")

        event = DEMO_EVENTS[0]
        event_text = event["event_text"]

        with TestClient(app) as client:
            health = assert_response_ok(client.get("/api/health"), "health check")
            if health.get("mock_mode") is not False:
                raise RuntimeError(f"health check reports mock_mode={health.get('mock_mode')!r}")

            case = assert_response_ok(
                client.post(
                    "/api/cases",
                    json={
                        "case_code": "SMOKE-REAL-001",
                        "title": "真实 API 烟测案例",
                        "domain": event["expected_domain"],
                        "public_demands": event["expected_demands"],
                        "heat_level": event["expected_heat"],
                        "response_speed": "24小时内",
                        "effect_score": 4,
                        "strategy_types": ["信息公开型", "行动补救型"],
                        "event_description": event_text,
                        "strategy_text": "成立专项调查组，公开阶段性进展，依法依规追责并公布整改安排。",
                    },
                ),
                "create smoke case",
            )
            case_id = case["id"]

            assert_response_ok(client.post(f"/api/cases/{case_id}/embedding"), "generate real embedding")
            case_after_embedding = assert_response_ok(client.get(f"/api/cases/{case_id}"), "read smoke case")
            if case_after_embedding["embedding_model"] == "mock-embedding":
                raise RuntimeError("embedding used mock-embedding instead of the configured real provider")

            profile = assert_response_ok(
                client.post("/api/events/profile", json={"event_text": event_text}),
                "generate real profile",
            )
            if profile["profile_source"] != "llm":
                raise RuntimeError(f"profile_source={profile['profile_source']!r}; expected real LLM source 'llm'")

            evidence_pack = assert_response_ok(
                client.post(
                    "/api/rag/evidence-pack",
                    json={"event_text": event_text, "profile": profile, "top_k": 3},
                ),
                "build evidence pack",
            )
            if not evidence_pack["retrieved_cases"]:
                raise RuntimeError("retrieval returned no cases")

            report = assert_response_ok(
                client.post(
                    "/api/reports",
                    json={
                        "input_event_text": event_text,
                        "profile": profile,
                        "evidence_pack": evidence_pack,
                        "generate_now": True,
                    },
                ),
                "generate real report",
            )
            if report["status"] != "ready":
                raise RuntimeError(f"report status={report['status']!r}; expected 'ready'")

            segment_models = sorted({segment["model_name"] for segment in report["segments"]})
            if "mock-llm" in segment_models:
                raise RuntimeError("report generation used mock-llm instead of the configured real provider")
            failed_segments = [
                segment["segment_key"]
                for segment in report["segments"]
                if segment["generation_status"] != "ready"
            ]
            if failed_segments:
                raise RuntimeError(f"report segments failed: {failed_segments}")

            exported = client.get(f"/api/reports/{report['id']}/export.md")
            if exported.status_code >= 400:
                raise RuntimeError(f"export report failed: HTTP {exported.status_code} {exported.text}")

            summary = {
                "mock_mode": settings.app_mock_mode,
                "embedding_model": case_after_embedding["embedding_model"],
                "profile_source": profile["profile_source"],
                "profile_domain": profile["domain"],
                "profile_heat_level": profile["heat_level"],
                "report_status": report["status"],
                "segment_models": segment_models,
                "retrieved_cases": len(evidence_pack["retrieved_cases"]),
                "markdown_chars": len(exported.text),
                "database": str(db_path),
            }
            print(json.dumps(summary, ensure_ascii=False, indent=2))
    finally:
        if "app.db.session" in sys.modules:
            from app.db.session import engine

            engine.dispose()
        temp_dir.cleanup()


if __name__ == "__main__":
    main()
