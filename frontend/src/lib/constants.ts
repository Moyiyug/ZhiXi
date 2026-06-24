export const DOMAIN_OPTIONS = [
  { value: "文化传播类", label: "文化传播类" },
  { value: "思想政治教育类", label: "思想政治教育类" },
  { value: "政府管理类", label: "政府管理类" },
  { value: "技术分析类", label: "技术分析类" },
  { value: "其他", label: "其他" },
] as const

export const HEAT_OPTIONS = [
  { value: 1, label: "1 级 — 可控" },
  { value: 2, label: "2 级 — 低位关注" },
  { value: 3, label: "3 级 — 中热度" },
  { value: 4, label: "4 级 — 高热度" },
  { value: 5, label: "5 级 — 高热/爆" },
] as const

export const DEMAND_OPTIONS = [
  { value: "要求信息公开", label: "要求信息公开" },
  { value: "要求问责", label: "要求问责" },
  { value: "要求道歉", label: "要求道歉" },
  { value: "要求监管整改", label: "要求监管整改" },
] as const

export const STRATEGY_OPTIONS = [
  { value: "信息公开型", label: "信息公开型" },
  { value: "行动补救型", label: "行动补救型" },
  { value: "快速道歉型", label: "快速道歉型" },
  { value: "转移引导型", label: "转移引导型" },
] as const

export const EXAMPLE_EVENTS = [
  {
    label: "高校食堂卫生问题",
    text: "某高校食堂被曝食品卫生问题，学生在社交平台发布图片后引发大量转发，评论区集中要求学校公开调查结果并追责相关负责人。学校目前尚未发布正式通报，校内学生情绪较为集中。",
  },
  {
    label: "景区 NPC 互动争议",
    text: "某景区沉浸式演出中，NPC 与游客互动环节被拍下并上传至抖音，部分观众认为互动内容低俗、不尊重游客。视频在 B 站和微博持续发酵，景区尚未回应，多家自媒体跟进报道。",
  },
  {
    label: "政务通报信息不透明",
    text: "某地方政府发布一则环保整改通报，但通报中关键数据未公开，整改措施描述模糊。多家媒体和环保组织呼吁公开完整数据，公众质疑通报的透明度和诚意。",
  },
] as const

export const GENERATION_STATUS_LABELS: Record<string, string> = {
  pending: "等待生成",
  generating: "生成中…",
  ready: "已生成",
  failed: "生成失败",
}
