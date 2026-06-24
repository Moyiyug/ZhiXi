from fastapi import APIRouter

from app.core.config import settings

router = APIRouter(prefix="/api", tags=["settings"])


@router.get("/settings/public")
def get_public_settings() -> dict:
    return {
        "mock_mode": settings.app_mock_mode,
        "embedding_model": settings.qwen_embedding_model,
        "llm_model_fast": settings.deepseek_model_fast,
        "llm_model_pro": settings.deepseek_model_pro,
        "keys": {
            "dashscope": "configured" if settings.dashscope_api_key else "missing",
            "deepseek": "configured" if settings.deepseek_api_key else "missing",
        },
        "retrieval": {
            "top_n": settings.retrieval_top_n,
            "top_k": settings.retrieval_top_k,
            "weights": {
                "semantic": settings.weight_semantic,
                "demand": settings.weight_demand,
                "heat": settings.weight_heat,
                "domain": settings.weight_domain,
                "effect": settings.weight_effect,
            },
        },
    }
