import json
import os

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine

os.environ["APP_MOCK_MODE"] = "true"
os.environ["APP_DEBUG"] = "false"


@pytest.fixture()
def client(tmp_path):
    db_path = tmp_path / "test.db"
    engine = create_engine(f"sqlite:///{db_path}", echo=False)

    # Import models
    # Override module engine
    import app.db.session as db_session
    import app.models.case  # noqa: F401
    import app.models.dictionary  # noqa: F401
    import app.models.evaluation  # noqa: F401
    import app.models.report  # noqa: F401
    import app.models.retrieval  # noqa: F401
    original = db_session.engine
    db_session.engine = engine

    # Create tables + seed
    SQLModel.metadata.create_all(engine)
    with Session(engine) as s:
        from app.db.seed import DEFAULT_DICT_ITEMS, DEMO_EVENTS
        from app.models.dictionary import BackgroundDictItem
        from app.models.evaluation import DemoEvent
        for cat, entries in DEFAULT_DICT_ITEMS.items():
            if cat == "domain_relations":
                for src, rels in entries.items():
                    s.add(BackgroundDictItem(category=cat, key=src, label=src, extra_json=rels))
            else:
                for e in entries:
                    s.add(BackgroundDictItem(
                        category=cat, key=e["key"], label=e["label"],
                        meaning=e.get("meaning", ""), report_hint=e.get("report_hint", ""),
                        speech_hint=e.get("speech_hint", ""),
                    ))
        for ev in DEMO_EVENTS:
            s.add(DemoEvent(
                demo_event_id=ev["demo_event_id"], title=ev["title"],
                event_text=ev["event_text"],
                expected_domain=ev.get("expected_domain"),
                expected_demands_json=json.dumps(ev.get("expected_demands", [])),
                expected_heat=ev.get("expected_heat"),
            ))
        s.commit()

    def get_test_session():
        with Session(engine) as s:
            yield s

    from app.db.session import get_session
    from app.main import app

    app.dependency_overrides[get_session] = get_test_session

    with TestClient(app) as c:
        yield c

    app.dependency_overrides.clear()
    db_session.engine = original
