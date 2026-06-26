"""Model clients used by ZhiXi services.

The production providers configured for this project expose OpenAI-compatible
HTTP APIs, so keep the adapter tiny and provider-agnostic.
"""

from __future__ import annotations

from typing import Any

from openai import OpenAI

from app.clients.mock_client import MockEmbeddingClient, MockLLMClient
from app.core.config import settings


class OpenAICompatibleEmbeddingClient:
    """Embedding client for OpenAI-compatible providers such as DashScope."""

    def __init__(self, api_key: str, base_url: str, model: str, dimensions: int | None = None):
        self.client = OpenAI(api_key=api_key, base_url=base_url)
        self.model = model
        self.dimensions = dimensions or 0

    def embed(self, text: str) -> list[float]:
        kwargs: dict[str, Any] = {
            "model": self.model,
            "input": text,
        }
        if self.dimensions:
            kwargs["dimensions"] = self.dimensions
        response = self.client.embeddings.create(**kwargs)
        vector = list(response.data[0].embedding)
        self.dimensions = len(vector)
        return vector

    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        kwargs: dict[str, Any] = {
            "model": self.model,
            "input": texts,
        }
        if self.dimensions:
            kwargs["dimensions"] = self.dimensions
        response = self.client.embeddings.create(**kwargs)
        vectors = [list(item.embedding) for item in response.data]
        if vectors:
            self.dimensions = len(vectors[0])
        return vectors


class OpenAICompatibleChatClient:
    """Chat completion client for OpenAI-compatible providers such as DeepSeek."""

    def __init__(self, api_key: str, base_url: str):
        self.client = OpenAI(api_key=api_key, base_url=base_url)

    def chat(self, prompt: str, model: str, **kwargs: Any) -> str:
        response = self.client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "system",
                    "content": "你是智析 ZhiXi 的严谨写作助手，只能基于用户提供的材料回答。",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=kwargs.get("temperature", 0.2),
            max_tokens=kwargs.get("max_tokens", 1000),
        )
        content = response.choices[0].message.content
        if not content:
            raise ValueError("LLM response was empty")
        return content.strip()


def get_embedding_client():
    if settings.app_mock_mode or not settings.has_embedding_key:
        return MockEmbeddingClient(
            model="mock-embedding",
            dimensions=settings.qwen_embedding_dimensions,
        )
    return OpenAICompatibleEmbeddingClient(
        api_key=settings.dashscope_api_key,
        base_url=settings.qwen_embedding_base_url,
        model=settings.qwen_embedding_model,
        dimensions=settings.qwen_embedding_dimensions,
    )


def get_chat_client():
    if settings.app_mock_mode or not settings.has_llm_key:
        return MockLLMClient()
    return OpenAICompatibleChatClient(
        api_key=settings.deepseek_api_key,
        base_url=settings.deepseek_base_url,
    )
