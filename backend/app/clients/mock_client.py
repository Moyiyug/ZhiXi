"""Deterministic mock clients for embedding and LLM calls.

Used when APP_MOCK_MODE=true or no API keys are configured.
"""

import hashlib
import time
from typing import Any

from app.core.logging import logger


def _text_hash(text: str, dims: int = 1024) -> list[float]:
    """Generate a deterministic pseudo-embedding from text hash."""
    h = hashlib.sha256(text.encode("utf-8")).hexdigest()
    chunks = [int(h[i : i + 8], 16) for i in range(0, len(h), 8)]
    vector = []
    for i in range(dims):
        val = (chunks[i % len(chunks)] * (i + 1) / 1e9) % 2 - 1
        vector.append(val)
    # Normalize to unit vector
    norm = sum(v * v for v in vector) ** 0.5
    if norm > 0:
        vector = [v / norm for v in vector]
    return vector


class MockEmbeddingClient:
    """Deterministic fake embedding client."""

    def __init__(self, model: str = "mock-embedding", dimensions: int = 1024):
        self.model = model
        self.dimensions = dimensions

    def embed(self, text: str) -> list[float]:
        logger.debug(f"Mock embedding: {text[:60]}… → {self.dimensions}d")
        return _text_hash(text, self.dimensions)

    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        return [self.embed(t) for t in texts]


class MockLLMClient:
    """Template-based mock LLM client for report generation."""

    def chat(self, prompt: str, model: str = "mock-llm", **kwargs: Any) -> str:
        logger.debug(f"Mock LLM call: model={model}, prompt_len={len(prompt)}")
        time.sleep(0.05)  # Simulate minimal latency

        # Detect segment type from prompt keywords
        if "舆情画像" in prompt or "历史案例参考" in prompt or "analysis_and_cases" in prompt:
            return self._mock_segment_one(prompt)
        elif "处置结论" in prompt or "回应话术" in prompt or "strategy_and_speech" in prompt:
            return self._mock_segment_two(prompt)
        elif "免责声明" in prompt or "disclaimer" in prompt:
            return self._mock_segment_three(prompt)
        else:
            return self._mock_generic(prompt)

    def _mock_segment_one(self, prompt: str) -> str:
        return """## 一、舆情画像与历史案例参考

该事件初步可归为思想政治教育类，主要诉求集中在信息公开与问责。
参考案例显示，类似事件中较有效的处理方式通常包括信息公开型、行动补救型策略。
由于当前案例库规模有限（课程项目小样本案例库），以下判断仅作为原型演示参考。"""

    def _mock_segment_two(self, prompt: str) -> str:
        return """## 二、处置结论与回应话术

**推荐处置方向：** 信息公开型 + 行动补救型
**首轮回应重点：** 发布阶段性说明，承认问题存在，承诺调查时间线
**后续补救动作：** 成立专项调查组，公布整改措施及验收标准

**回应话术示例：**
> 我们对相关情况高度重视，已成立专项调查组依法依规核查，相关进展将阶段性公布。感谢社会各界的监督，我们将持续改进工作。

**避免事项：**
- 不得在调查完成前做出具体承诺
- 不得虚构未核实的事实
- 不得推诿责任或使用空泛道歉
"""

    def _mock_segment_three(self, prompt: str) -> str:
        return """## 三、免责声明与使用边界

本报告基于有限的课程项目原型案例库与模型生成结果，仅为舆情处置决策提供辅助参考，不构成真实的处置决策依据。系统未进行全网监测，未完成严格的因果推断。所有建议均需经人工复核后方可使用。"""

    def _mock_generic(self, prompt: str) -> str:
        return "[Mock 生成内容] 请根据实际 API Key 配置启用真实模型生成。"
