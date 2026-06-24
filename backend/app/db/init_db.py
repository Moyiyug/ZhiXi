from app.core.logging import logger
from app.db.session import init_db


def initialize_database() -> None:
    logger.info("Initializing database…")
    init_db()
    logger.info("Database initialized.")
