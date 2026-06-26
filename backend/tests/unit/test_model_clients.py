from app.clients.mock_client import MockEmbeddingClient, MockLLMClient
from app.clients.model_clients import (
    OpenAICompatibleChatClient,
    OpenAICompatibleEmbeddingClient,
    get_chat_client,
    get_embedding_client,
)
from app.core.config import settings


def test_embedding_client_uses_real_provider_when_configured(monkeypatch):
    monkeypatch.setattr(settings, "app_mock_mode", False)
    monkeypatch.setattr(settings, "dashscope_api_key", "test-key")
    monkeypatch.setattr(settings, "qwen_embedding_base_url", "https://example.test/v1")

    client = get_embedding_client()

    assert isinstance(client, OpenAICompatibleEmbeddingClient)
    assert not isinstance(client, MockEmbeddingClient)


def test_chat_client_uses_real_provider_when_configured(monkeypatch):
    monkeypatch.setattr(settings, "app_mock_mode", False)
    monkeypatch.setattr(settings, "deepseek_api_key", "test-key")
    monkeypatch.setattr(settings, "deepseek_base_url", "https://example.test")

    client = get_chat_client()

    assert isinstance(client, OpenAICompatibleChatClient)
    assert not isinstance(client, MockLLMClient)
