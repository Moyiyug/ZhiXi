from collections.abc import Generator

from sqlmodel import Session, SQLModel, create_engine

from app.core.config import settings

engine = create_engine(settings.database_url, echo=settings.app_debug)


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session


def init_db() -> None:
    # Ensure all model modules are imported so tables are registered
    import app.models.case  # noqa: F401
    import app.models.dictionary  # noqa: F401
    import app.models.evaluation  # noqa: F401
    import app.models.report  # noqa: F401
    import app.models.retrieval  # noqa: F401

    SQLModel.metadata.create_all(engine)
    _run_sqlite_migrations()


def _run_sqlite_migrations() -> None:
    if engine.url.get_backend_name() != "sqlite":
        return
    with engine.begin() as conn:
        dict_columns = {
            row[1] for row in conn.exec_driver_sql("PRAGMA table_info(background_dict_items)").all()
        }
        if "default_weight" not in dict_columns:
            conn.exec_driver_sql("ALTER TABLE background_dict_items ADD COLUMN default_weight FLOAT")
