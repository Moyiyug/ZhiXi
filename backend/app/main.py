from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import (
    cases,
    dashboard,
    dictionaries,
    embeddings,
    evaluation,
    events,
    health,
    rag,
    reports,
)
from app.api import (
    settings as settings_router,
)
from app.core.config import settings
from app.core.logging import logger
from app.db.init_db import initialize_database
from app.db.seed import run_all_seeds


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting ZhiXi backend (env={settings.app_env}, mock={settings.app_mock_mode})")
    initialize_database()
    run_all_seeds()
    yield
    logger.info("Shutting down ZhiXi backend.")


app = FastAPI(
    title="ZhiXi API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(dashboard.router)
app.include_router(cases.router)
app.include_router(dictionaries.router)
app.include_router(embeddings.router)
app.include_router(events.router)
app.include_router(rag.router)
app.include_router(reports.router)
app.include_router(settings_router.router)
app.include_router(evaluation.router)
