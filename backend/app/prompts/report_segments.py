ANALYSIS_AND_CASES_TITLE = "一、舆情画像与历史案例参考"

ANALYSIS_AND_CASES_PROMPT = """你是一个舆情分析助手。请只基于下方 Evidence Pack 撰写「舆情画像与历史案例参考」章节。

要求：
- 分析当前事件的类型、主要公众诉求和风险等级。
- 引用 Top-K 参考案例，说明为什么这些案例可参考。
- 不超过 800 字。
- 不要虚构热搜排名、转发量、阅读量等传播数据。
- 不要声称系统完成了全网监测。

Evidence Pack:
{evidence_pack}
"""

STRATEGY_AND_SPEECH_TITLE = "二、处置结论与回应话术"

STRATEGY_AND_SPEECH_PROMPT = """你是一个舆情处置策略顾问。请只基于下方 Evidence Pack 撰写「处置结论与回应话术」章节。

要求：
- 给出推荐的处置方向。
- 说明首轮回应重点。
- 说明后续补救动作。
- 提供至少一段具体的回应话术（使用「阶段性说明」「持续更新」「依法依规核查」等稳健表达）。
- 列出需要避免的事项。
- 不承诺未调查清楚的事实。
- 避免官腔空话。

Evidence Pack:
{evidence_pack}
"""

DISCLAIMER_TITLE = "三、免责声明与使用边界"

DISCLAIMER_PROMPT = """请只基于下方 Evidence Pack 撰写「免责声明与使用边界」章节。

要求：
- 80-180 字。
- 明确说明：当前案例库为课程项目小样本案例库。
- 明确说明：报告为模型生成，不构成真实处置决策依据。
- 明确说明：需要人工复核。

Evidence Pack:
{evidence_pack}
"""

SEGMENT_KEY_MAP = {
    "analysis_and_cases": {"title": ANALYSIS_AND_CASES_TITLE, "prompt": ANALYSIS_AND_CASES_PROMPT},
    "strategy_and_speech": {"title": STRATEGY_AND_SPEECH_TITLE, "prompt": STRATEGY_AND_SPEECH_PROMPT},
    "disclaimer": {"title": DISCLAIMER_TITLE, "prompt": DISCLAIMER_PROMPT},
}
