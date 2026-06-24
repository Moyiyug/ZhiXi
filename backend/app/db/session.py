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
