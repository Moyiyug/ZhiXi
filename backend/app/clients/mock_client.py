"""Deterministic mock clients for embedding and LLM calls.

Used when APP_MOCK_MODE=true or no API keys are configured.
"""

import hashlib
import re
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
        summary = self._extract_value(prompt, "摘要")
        domain_line = self._extract_line_contains(prompt, "领域：")
        case_title, case_score = self._extract_first_case(prompt)
        route_reason = self._extract_value(prompt, "路由依据")
        feedback = self._extract_value(prompt, "历史反馈")
        score_line = self._extract_value(prompt, "分数拆解")
        case_text = f"首位参考案例为“{case_title}”，综合匹配度约 {case_score}。" if case_title else "当前未检索到可稳定引用的历史案例。"
        route_text = f"路由依据显示：{route_reason}。" if route_reason else "路由信息较少，需降低结论确定性。"
        feedback_text = f"历史反馈提示：{feedback}" if feedback else "历史样本反馈不足，需人工复核。"
        return f"""## 一、舆情画像与历史案例参考

**判断依据：** 当前事件摘要为“{summary or '未提供'}”。{domain_line or '领域、热度和诉求以系统画像为准。'} 参考匹配度来自语义相似、诉求匹配、热度接近、领域关系和历史效果五项加权，不能等同于真实传播规模。{score_line or ''}

**可参考点：** {case_text}{route_text} 可借鉴路径是先确认事实边界，再公开调查节奏，并把整改动作拆成可检查的交付物。{feedback_text}

**不确定性：** 当前案例库为课程项目小样本，未接入实时舆情数据；因此风险等级和案例参考价值应作为处置讨论的输入，而不是最终结论。"""

    def _mock_segment_two(self, prompt: str) -> str:
        summary = self._extract_value(prompt, "摘要")
        checkpoints = self._extract_checkpoints(prompt)
        primary_checkpoint = checkpoints[0] if checkpoints else "明确已核查事实、待核查事项、下一次更新时间"
        second_checkpoint = checkpoints[1] if len(checkpoints) > 1 else "给出整改清单、责任主体、验收标准和反馈渠道"
        case_title, _ = self._extract_first_case(prompt)
        case_reference = f"参考“{case_title}”的历史处置经验，" if case_title else ""
        return f"""## 二、处置结论与回应话术

**推荐处置方向：** 以信息公开型为主、行动补救型为辅。{case_reference}当前事件应先稳定事实预期，再把整改动作落到可检查的时间表，避免只给原则性表态。

**0-2 小时：** 责任主体为事件主管部门和宣传口，动作是围绕“{summary or '当前事件'}”完成事实边界核验并发布阶段性说明，交付物为一份短通报，至少包含：{primary_checkpoint}。

**24 小时内：** 责任主体为专项核查小组，动作是梳理责任链条、接收投诉材料、公布临时整改措施，交付物为调查进度表、问题清单和下一轮公开节点；验收方式是让公众能看到哪些事项已经确认、哪些事项还在核实。

**3-7 天：** 责任主体为业务主管部门，动作是公布处理结果、整改验收标准和复盘安排，交付物为整改清单、责任处理说明和后续监督渠道，重点落实：{second_checkpoint}。

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

    @staticmethod
    def _extract_value(prompt: str, label: str) -> str:
        pattern = re.compile(rf"^\s*-\s*{re.escape(label)}：(.+)$", re.MULTILINE)
        match = pattern.search(prompt)
        return match.group(1).strip() if match else ""

    @staticmethod
    def _extract_line_contains(prompt: str, needle: str) -> str:
        for line in prompt.splitlines():
            if needle in line and line.strip().startswith("-"):
                return line.strip().lstrip("-").strip()
        return ""

    @staticmethod
    def _extract_first_case(prompt: str) -> tuple[str, str]:
        match = re.search(r"^\s*1\.\s*(.+?)（.+?综合匹配：(.+?)[；）]", prompt, flags=re.MULTILINE)
        if not match:
            return "", ""
        return match.group(1).strip(), match.group(2).strip()

    @staticmethod
    def _extract_checkpoints(prompt: str) -> list[str]:
        values = re.findall(r"可执行检查点：(.+)", prompt)
        checkpoints: list[str] = []
        for value in values:
            checkpoints.extend([item.strip() for item in re.split(r"[；;]", value) if item.strip()])
        return checkpoints[:4]
