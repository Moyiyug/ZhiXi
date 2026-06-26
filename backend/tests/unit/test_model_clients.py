from types import SimpleNamespace

import pytest

from app.clients.mock_client import MockEmbeddingClient, MockLLMClient
from app.clients.model_clients import (
    OpenAICompatibleChatClient,
    OpenAICompatibleEmbeddingClient,
    get_chat_client,
    get_embedding_client,
)
from app.core.config import settings


class _FakeCompletions:
    def __init__(self, responses):
        self.responses = list(responses)
        self.calls = []

    def create(self, **kwargs):
        self.calls.append(kwargs)
        content, finish_reason = self.responses.pop(0)
        return SimpleNamespace(
            choices=[
                SimpleNamespace(
                    message=SimpleNamespace(content=content),
                    finish_reason=finish_reason,
                )
            ]
        )


def _fake_chat_client(responses):
    client = OpenAICompatibleChatClient.__new__(OpenAICompatibleChatClient)
    completions = _FakeCompletions(responses)
    client.client = SimpleNamespace(chat=SimpleNamespace(completions=completions))
    return client, completions


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


def test_chat_client_continues_when_response_hits_token_limit():
    client, completions = _fake_chat_client([
        ("第一段在这里被截断", "length"),
        ("，这里继续写到自然结束。", "stop"),
    ])

    content = client.chat("生成报告", model="deepseek-test", max_tokens=120, max_continuations=1)

    assert content == "第一段在这里被截断，这里继续写到自然结束。"
    assert len(completions.calls) == 2
    assert completions.calls[0]["max_tokens"] == 120
    assert completions.calls[1]["messages"][-2]["role"] == "assistant"
    assert "继续写" in completions.calls[1]["messages"][-1]["content"]


def test_chat_client_raises_when_response_stays_truncated():
    client, _ = _fake_chat_client([
        ("仍然没有写完", "length"),
    ])

    with pytest.raises(ValueError, match="truncated"):
        client.chat("生成报告", model="deepseek-test", max_tokens=80, max_continuations=0)
