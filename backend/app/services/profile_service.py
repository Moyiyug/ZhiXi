import hashlib
import json
import re
from typing import Any

from sqlmodel import Session

from app.clients.model_clients import get_chat_client
from app.core.config import settings
from app.core.logging import logger
from app.schemas.event import CurrentEventProfile, ManualHints
from app.services.dictionary_service import get_dictionaries

DOMAIN_KEYWORDS = {
    "思想政治教育类": ["高校", "学生", "校园", "教育", "食堂"],
    "文化传播类": ["景区", "NPC", "互动", "演出", "传播", "视频", "抖音", "B站"],
    "政府管理类": ["政府", "通报", "政务", "环保", "官方", "监管"],
    "技术分析类": ["技术", "数据", "工程", "算法", "系统"],
}

DEMAND_KEYWORDS = {
    "要求信息公开": ["公开", "透明", "通报", "信息", "数据"],
    "要求问责": ["问责", "追责", "责任人", "调查"],
    "要求道歉": ["道歉", "致歉", "承认错误"],
    "要求监管整改": ["整改", "监管", "整治", "规范"],
}

PLATFORM_KEYWORDS = {
    "微博": ["微博", "热搜", "文娱榜"],
    "抖音": ["抖音"],
    "小红书": ["小红书"],
    "B站": ["B站", "bilibili", "Bilibili"],
    "微信": ["微信", "朋友圈"],
}

HEAT_UP_KEYWORDS = ["热搜", "大量转发", "爆", "发酵", "广泛", "多平台", "全网"]
HEAT_DOWN_KEYWORDS = ["可控", "低位", "同城榜", "小范围", "已平息"]


class ProfileService:
    def __init__(self, session: Session):
        self.session = session

    def generate_profile(self, event_text: str, manual_hints: ManualHints | None = None) -> CurrentEventProfile:
        profile, profile_source, confidence = self._initial_profile(event_text, manual_hints)
        is_manual = False
        if manual_hints:
            if manual_hints.domain:
                profile["domain"] = manual_hints.domain
                is_manual = True
            if manual_hints.heat_level is not None:
                profile["heat_level"] = manual_hints.heat_level
                is_manual = True
            if manual_hints.public_demands is not None:
                profile["public_demands"] = manual_hints.public_demands
                is_manual = True
        # profile_source reflects whether key fields came from manual hints, rules, or the LLM.
        if (
            is_manual
            and manual_hints
            and manual_hints.domain
            and manual_hints.heat_level is not None
            and manual_hints.public_demands
        ):
            profile_source = "manual"
            confidence = 1.0
        elif manual_hints:
            profile_source = "mixed"
            confidence = min(confidence, 0.9)
        platforms = self._extract_platforms(event_text)
        inferred = self._infer_strategy_directions(
            domain=profile["domain"],
            demands=profile["public_demands"],
        )
        return CurrentEventProfile(
            event_summary=profile["event_summary"],
            domain=profile["domain"],
            public_demands=profile["public_demands"],
            heat_level=profile["heat_level"],
            risk_keywords=profile["risk_keywords"],
            platforms=platforms,
            inferred_strategy_direction=inferred,
            confidence=confidence,
            profile_source=profile_source,
        )

    def _initial_profile(self, event_text: str, manual_hints: ManualHints | None) -> tuple[dict, str, float]:
        rule_profile = self._rule_based_profile(event_text)
        full_manual = bool(
            manual_hints
            and manual_hints.domain
            and manual_hints.heat_level is not None
            and manual_hints.public_demands
        )
        if settings.app_mock_mode or not settings.has_llm_key or full_manual:
            return rule_profile, "rule", self._mock_confidence(event_text)
        try:
            llm_profile = self._llm_profile(event_text, rule_profile)
            return llm_profile, "llm", float(llm_profile.get("confidence", 0.85))
        except Exception as exc:
            logger.warning(f"LLM profile generation failed, using rule fallback: {exc}")
            return rule_profile, "rule", self._mock_confidence(event_text)

    def _llm_profile(self, event_text: str, fallback: dict) -> dict:
        dicts = get_dictionaries(self.session)
        domains = [item["key"] for item in dicts.get("domain_labels", [])]
        demands = [item["key"] for item in dicts.get("public_demands", [])]
        prompt = f"""请根据当前舆情事件生成 JSON 画像。

必须只输出 JSON 对象，不要输出 Markdown。
字段：
- event_summary: 50 字以内摘要
- domain: 必须从 {domains} 中选择
- public_demands: 必须从 {demands} 中选择 1-3 项
- heat_level: 1 到 5 的整数
- risk_keywords: 3-8 个短关键词
- platforms: 0-4 个传播平台名称
- confidence: 0.8 到 0.95 的数字

事件文本：
{event_text}
"""
        content = get_chat_client().chat(
            prompt,
            model=settings.deepseek_model_fast,
            temperature=0.1,
            max_tokens=700,
        )
        data = self._extract_json_object(content)
        return self._normalize_llm_profile(data, fallback, domains, demands)

    @staticmethod
    def _extract_json_object(content: str) -> dict[str, Any]:
        text = content.strip()
        fenced = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, flags=re.S)
        if fenced:
            text = fenced.group(1)
        else:
            start = text.find("{")
            end = text.rfind("}")
            if start != -1 and end != -1 and end > start:
                text = text[start : end + 1]
        data = json.loads(text)
        if not isinstance(data, dict):
            raise ValueError("LLM profile response is not a JSON object")
        return data

    @staticmethod
    def _normalize_llm_profile(
        data: dict[str, Any],
        fallback: dict,
        domains: list[str],
        demands: list[str],
    ) -> dict:
        domain = data.get("domain")
        if domain not in domains:
            domain = fallback["domain"]
        if fallback["domain"] != "其他":
            domain = fallback["domain"]

        raw_demands = data.get("public_demands", [])
        if not isinstance(raw_demands, list):
            raw_demands = []
        public_demands = []
        for item in [*fallback["public_demands"], *raw_demands]:
            value = str(item)
            if value in demands and value not in public_demands:
                public_demands.append(value)
        if not public_demands:
            public_demands = fallback["public_demands"]

        try:
            heat_level = int(data.get("heat_level", fallback["heat_level"]))
        except (TypeError, ValueError):
            heat_level = fallback["heat_level"]
        heat_level = max(min(max(heat_level, 1), 5), fallback["heat_level"])

        risk_keywords = data.get("risk_keywords", [])
        if not isinstance(risk_keywords, list):
            risk_keywords = []
        risk_keywords = [
            str(item).strip()
            for item in [*fallback["risk_keywords"], *risk_keywords]
            if str(item).strip()
        ]
        risk_keywords = list(dict.fromkeys(risk_keywords))[:8]
        if not risk_keywords:
            risk_keywords = fallback["risk_keywords"]

        platforms = data.get("platforms", [])
        if not isinstance(platforms, list):
            platforms = []
        platforms = [str(item).strip() for item in platforms if str(item).strip()][:4]

        try:
            confidence = float(data.get("confidence", 0.85))
        except (TypeError, ValueError):
            confidence = 0.85
        confidence = min(max(confidence, 0.5), 0.95)

        summary = str(data.get("event_summary") or fallback["event_summary"]).strip()
        return {
            "event_summary": summary[:120],
            "domain": domain,
            "public_demands": public_demands[:3],
            "heat_level": heat_level,
            "risk_keywords": risk_keywords,
            "platforms": platforms,
            "confidence": confidence,
        }

    def _rule_based_profile(self, event_text: str) -> dict:
        domain = "其他"
        for d, keywords in DOMAIN_KEYWORDS.items():
            if any(kw in event_text for kw in keywords):
                domain = d
                break
        demands = []
        for d, keywords in DEMAND_KEYWORDS.items():
            if any(kw in event_text for kw in keywords):
                demands.append(d)
        if not demands:
            demands = ["要求信息公开"]
        heat = 3
        if any(kw in event_text for kw in HEAT_DOWN_KEYWORDS):
            heat = 2
        if any(kw in event_text for kw in ["可控", "低位", "同城榜"]):
            heat = 1
        if any(kw in event_text for kw in HEAT_UP_KEYWORDS):
            heat = max(heat, 4)
        if any(kw in event_text for kw in ["爆", "全网", "多平台"]):
            heat = 5
        keywords = re.findall(r"[一-鿿]{2,4}", event_text[:200])
        risk_kw = list(set(kw for kw in keywords if len(kw) >= 2))[:8]
        return {
            "event_summary": event_text[:120].strip() + "…" if len(event_text) > 120 else event_text.strip(),
            "domain": domain,
            "public_demands": demands,
            "heat_level": heat,
            "risk_keywords": risk_kw,
        }

    @staticmethod
    def _mock_confidence(event_text: str) -> float:
        """Deterministic mock confidence in 0.70–0.85 range."""
        h = int(hashlib.sha256(event_text.encode()).hexdigest()[:4], 16)
        return round(0.70 + (h % 1500) / 10000, 4)

    @staticmethod
    def _infer_strategy_directions(domain: str, demands: list[str]) -> list[str]:
        """Infer strategy directions from domain and demands."""
        directions = []
        for demand in demands:
            if "信息公开" in demand:
                directions.append("信息公开型")
            if "问责" in demand:
                directions.append("行动补救型")
            if "道歉" in demand:
                directions.append("快速道歉型")
            if "监管" in demand or "整改" in demand:
                directions.append("转移引导型")
        # Deduplicate
        seen = set()
        result = []
        for d in directions:
            if d not in seen:
                seen.add(d)
                result.append(d)
        return result if result else ["信息公开型"]

    @staticmethod
    def _extract_platforms(event_text: str) -> list[str]:
        platforms = []
        for name, keywords in PLATFORM_KEYWORDS.items():
            if any(kw in event_text for kw in keywords):
                platforms.append(name)
        return platforms
