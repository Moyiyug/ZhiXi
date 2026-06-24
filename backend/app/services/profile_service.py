import re

from sqlmodel import Session

from app.schemas.event import CurrentEventProfile, ManualHints

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
        profile = self._rule_based_profile(event_text)
        if manual_hints:
            if manual_hints.domain:
                profile["domain"] = manual_hints.domain
            if manual_hints.heat_level is not None:
                profile["heat_level"] = manual_hints.heat_level
            if manual_hints.public_demands is not None:
                profile["public_demands"] = manual_hints.public_demands
        profile_source = "mixed" if manual_hints else "rule"
        platforms = self._extract_platforms(event_text)
        return CurrentEventProfile(
            event_summary=profile["event_summary"],
            domain=profile["domain"],
            public_demands=profile["public_demands"],
            heat_level=profile["heat_level"],
            risk_keywords=profile["risk_keywords"],
            platforms=platforms,
            confidence=0.75,
            profile_source=profile_source,
        )

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
    def _extract_platforms(event_text: str) -> list[str]:
        platforms = []
        for name, keywords in PLATFORM_KEYWORDS.items():
            if any(kw in event_text for kw in keywords):
                platforms.append(name)
        return platforms
