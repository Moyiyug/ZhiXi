from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_env: str = "development"
    app_debug: bool = True
    app_mock_mode: bool = True

    database_url: str = "sqlite:///./data/zhixi.db"

    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    dashscope_api_key: str = ""
    qwen_embedding_base_url: str = "https://dashscope.aliyuncs.com/compatible-mode/v1"
    qwen_embedding_model: str = "text-embedding-v4"
    qwen_embedding_dimensions: int = 1024

    deepseek_api_key: str = ""
    deepseek_base_url: str = "https://api.deepseek.com"
    deepseek_model_fast: str = "deepseek-v4-flash"
    deepseek_model_pro: str = "deepseek-v4-pro"

    retrieval_top_n: int = 10
    retrieval_top_k: int = 3
    weight_semantic: float = 0.45
    weight_demand: float = 0.20
    weight_heat: float = 0.15
    weight_domain: float = 0.10
    weight_effect: float = 0.10

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def has_embedding_key(self) -> bool:
        return bool(self.dashscope_api_key)

    @property
    def has_llm_key(self) -> bool:
        return bool(self.deepseek_api_key)


settings = Settings()
