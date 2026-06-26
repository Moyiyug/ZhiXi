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
        if "免责声明与使用边界" in prompt or "disclaimer" in prompt:
            return self._mock_segment_three(prompt)
        elif "处置结论与回应话术" in prompt or "strategy_and_speech" in prompt:
            return self._mock_segment_two(prompt)
        elif "舆情画像与历史案例参考" in prompt or "analysis_and_cases" in prompt:
            return self._mock_segment_one(prompt)
        else:
            return self._mock_generic(prompt)

    def _mock_segment_one(self, prompt: str) -> str:
        return """## 一、舆情画像与历史案例参考

**判断依据：** 该事件初步可归为思想政治教育类，主要诉求集中在信息公开与问责，热度已接近需要阶段性回应的区间。参考匹配度来自语义相似、诉求匹配、热度接近、领域关系和历史效果五项加权，不代表真实传播规模。

**可参考点：** Top-K 案例共同指向“先确认事实边界，再公开调查节奏，再给出补救动作”的路径。相似案例中的信息公开型和行动补救型策略，可用于降低公众对拖延、回避和责任不清的质疑。

**不确定性：** 当前案例库为课程项目小样本，未接入实时舆情数据；因此风险等级和案例参考价值应作为处置讨论的输入，而不是最终结论。"""

    def _mock_segment_two(self, prompt: str) -> str:
        return """## 二、处置结论与回应话术

**推荐处置方向：** 以信息公开型为主、行动补救型为辅。当前诉求集中在事实透明和责任边界，首轮回应应先稳定信息预期，再把整改动作落到可检查的时间表。

**0-2 小时：** 责任主体为事件主管部门和宣传口，动作是完成事实边界核验并发布阶段性说明，交付物为一份包含“已核查事项、正在核查事项、下一次更新时间”的短通报。

**24 小时内：** 责任主体为专项核查小组，动作是梳理责任链条、接收投诉材料、公布临时整改措施，交付物为调查进度表和问题清单。

**3-7 天：** 责任主体为业务主管部门，动作是公布处理结果、整改验收标准和复盘安排，交付物为整改清单、责任处理说明和后续监督渠道。

**回应话术示例：**
> 我们已关注到相关情况，正在依法依规核查事实和责任边界。对已经确认的问题，将立即采取整改措施；对仍需核实的信息，将在下一次阶段性说明中持续更新。感谢公众监督，我们会同步公布核查进展、整改安排和反馈渠道。

**避免事项：**
- 不在调查完成前承诺具体责任结论，避免后续口径反复。
- 不用“个别现象”“正在了解”等空泛表述替代事实边界。
- 不把注意力转向无关话题，避免被解读为回避核心诉求。
"""

    def _mock_segment_three(self, prompt: str) -> str:
        return """## 三、免责声明与使用边界

本报告基于有限的课程项目原型案例库与模型生成结果，仅为舆情处置决策提供辅助参考，不构成真实的处置决策依据。系统未接入公开网络传播数据，未完成严格的因果推断。所有建议均需经人工复核后方可使用。"""

    def _mock_generic(self, prompt: str) -> str:
        return "[Mock 生成内容] 请根据实际 API Key 配置启用真实模型生成。"
