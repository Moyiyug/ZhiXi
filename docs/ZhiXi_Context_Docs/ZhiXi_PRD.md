# ZhiXi_PRD.md

> 产品名称：**智析 ZhiXi — 基于小样本案例库的 RAG 舆情处置建议辅助生成系统**  
> 文档版本：v0.2 演示优先版  
> 适用对象：课程项目开发、vibe coding 上下文、前后端协作、答辩演示  
> 最后更新：2026-06-24

---

## 0. 文档目的

本 PRD 是项目的**功能源头文件**。后续前端、后端、测试和开发计划均以本文为准。

本项目不是线上舆情监测平台，也不是严肃决策系统，而是一个用于数学建模结课作业展示的 **RAG 辅助写作系统原型**：

- 使用已收集的少量历史舆情案例作为参考素材。
- 通过结构化标签、背景判断字典、embedding 向量召回和加权重排寻找参考案例。
- 将参考案例整理成 Evidence Pack。
- 分段调用大模型生成高信息密度的处置建议报告。
- 前端以“黑色舞台 + 蓝白技术线稿 + 报告画布”的风格进行演示。

---

## 1. 产品定位

### 1.1 一句话定位

**智析 ZhiXi 是一个基于小样本历史案例库与 RAG 技术的舆情处置建议辅助生成系统。**

用户输入一个当前舆情事件，系统先生成事件画像，再检索相似历史案例，最后分段生成一份短而密的舆情处置建议报告。

### 1.2 产品核心价值

1. **演示数据闭环**：案例入库 → 向量化 → 检索 → 重排 → Evidence Pack → 分段报告生成。
2. **避免过度承诺**：不声称全网监测，不声称因果证明，不生成过长、过细、超出数据支撑能力的报告。
3. **保留建模表达**：使用可解释的加权相似度公式，展示语义相似、诉求匹配、热度接近、领域匹配、历史效果等指标。
4. **面向 vibe coding**：需求、模块、接口、验收标准必须清晰，方便大模型按文件逐步实现。

### 1.3 目标用户

| 用户 | 场景 | 目标 |
|---|---|---|
| 学生开发者 | 课程项目开发 | 快速实现可演示的 RAG 产品闭环 |
| 答辩听众/老师 | 项目展示 | 理解系统如何用数据和模型生成策略建议 |
| 伪业务用户 | 舆情事件输入 | 获得短报告、参考案例和回应话术 |

---

## 2. 项目边界

### 2.1 必须做 P0

- 案例素材库：新增、编辑、删除、启用/停用、CSV 导入、重新生成 embedding。
- 背景判断字典：公众诉求、热度等级、策略类型、领域标签的解释和提示。
- 当前事件输入与事件画像生成。
- RAG 检索：构造检索文本 → embedding → Top-N 向量召回 → 加权重排 → Top-K 参考案例。
- Evidence Pack 生成。
- 三段式报告生成：
  1. 舆情画像与历史案例参考。
  2. 处置结论与回应话术。
  3. 免责声明与使用边界。
- 报告操作：局部重新生成、复制、导出 Markdown（不支持手动文本编辑）。
- 每段报告可单独重新生成。
- Mock 模式：无 API Key 时所有模型调用（Embedding、Profile、Report）必须有 deterministic fallback，保证完整演示流程。
- 前后端可通过 Swagger/OpenAPI 对接。

### 2.2 建议做 P1

- 工作台数据概览。
- 检索过程可视化。
- 相似度拆解可视化。
- LLM 调用时间线。
- Markdown 报告预览。
- 简单评估页：固定测试样例、Top-K 结果展示、人工评分入口。

### 2.3 暂不做 P2

这些内容可以写进“未来展望”，但本项目演示版不实现：

- 实时爬虫和全网监测。
- 多平台热度实时统计。
- 严格 PSM/DID 因果推断。
- 多用户权限系统。
- 复杂 GraphRAG。
- 多 Agent 舆情演化仿真。
- 自动发布官方声明。
- 声称策略有效或能替代真实舆情处置专家。

---

## 3. 核心产品原则

### 3.1 数据诚实原则

系统必须明确提示：当前案例库是小样本课程原型案例库。报告中的建议仅基于有限历史案例和模型生成结果，不构成真实处置决策。

### 3.2 报告短而密原则

最终报告不做复杂章节，不生成“大而全”的长报告。固定为三段式：

```text
一、舆情画像与历史案例参考
二、处置结论与回应话术
三、免责声明与使用边界
```

每段必须有明确目的，不堆砌套话。

### 3.3 检索可解释原则

每个参考案例都必须展示：

- 总体参考匹配度。
- 语义相似度。
- 公众诉求匹配。
- 热度等级接近度。
- 领域匹配。
- 历史效果权重。
- 推荐理由。

### 3.4 分段生成原则

不得一次性调用大模型生成完整报告。必须分段调用：

```text
Evidence Pack
  -> LLM Call 1: 舆情画像与历史案例参考
  -> LLM Call 2: 处置结论与回应话术
  -> LLM Call 3: 免责声明与使用边界
```

### 3.5 前端演示优先原则

前端不要把案例库做成“海量数据库”的感觉，而要做成“精致素材库 + 检索过程舞台”。界面需要有强烈风格，但不能牺牲可读性和答辩展示效率。

---

## 4. 信息架构

### 4.1 页面结构

| 页面 | 路由 | 级别 | 功能 |
|---|---|---|---|
| 工作台 | `/` | P1 | 系统状态、案例数量、最近报告、流程说明 |
| 案例素材库 | `/cases` | P0 | 展示、筛选、新增、编辑、导入、向量化 |
| 智能生成 | `/generate` | P0 | 输入事件、生成画像、检索案例、生成报告 |
| 报告编辑 | `/reports/:id` | P0 | 三段式报告、重新生成、复制、导出 |
| 调试/设置 | `/settings` | P1 | 模型配置展示、Mock 开关、字典查看 |
| 简单评估 | `/evaluation` | P1 | 固定回放测试、Top-K 和人工评分展示 |

### 4.2 页面主流程

```text
用户进入工作台
  -> 查看系统状态
  -> 进入案例素材库，确认可检索案例
  -> 进入智能生成页
  -> 输入当前事件
  -> 系统生成事件画像
  -> 用户确认或修改事件画像
  -> 系统检索 Top-K 参考案例
  -> 系统展示参考匹配度
  -> 用户点击生成报告
  -> 系统分段生成报告
  -> 用户在报告页查看、局部重生成、复制或导出
```

---

## 5. 数据对象设计

### 5.1 Case 舆情案例

案例来自 CSV 或手动新增。字段命名以后端 API 为准，前端使用 OpenAPI 生成类型。

```ts
export type CaseItem = {
  id: number
  case_code?: string
  title: string
  domain: '文化传播类' | '思想政治教育类' | '政府管理类' | '技术分析类' | '其他'
  public_demands: string[]
  heat_level: 1 | 2 | 3 | 4 | 5
  response_speed?: string
  effect_score?: 1 | 2 | 3 | 4 | 5
  strategy_types: string[]
  event_description: string
  strategy_text: string
  vertical_subject?: string
  carrier_target?: string
  trigger_reason?: string
  risk_tags?: string[]
  notes?: string
  enabled: boolean
  embedding_status: 'none' | 'pending' | 'ready' | 'failed'
  created_at: string
  updated_at: string
}
```

#### 5.1.1 案例状态

| 状态 | 含义 | 是否参与检索 |
|---|---|---|
| `enabled=true` + `embedding_status=ready` | 可检索案例 | 是 |
| `enabled=false` | 用户停用 | 否 |
| `embedding_status=none` | 未生成向量 | 否 |
| `embedding_status=failed` | 向量生成失败 | 否 |

### 5.2 BackgroundDictionary 背景判断字典

背景判断字典用于统一：

- 结构化字段解释。
- embedding 文本构造。
- 报告 Prompt 约束。
- 前端标签说明。

```ts
export type DictItem = {
  key: string
  label: string
  meaning: string
  report_hint: string
  speech_hint?: string
  risk_hint?: string
  default_weight?: number
}
```

#### 5.2.1 公众诉求字典示例

```json
{
  "要求信息公开": {
    "meaning": "公众主要关注事实、时间线和处置进展是否透明。",
    "report_hint": "报告中应强调信息披露、阶段性说明和持续更新机制。",
    "speech_hint": "回应话术应避免含糊表达，需说明已核查事项、未核查事项和下一次更新时间。"
  },
  "要求问责": {
    "meaning": "公众关注责任主体、责任边界和处理结果。",
    "report_hint": "报告中应强调调查责任、责任划分和问责机制。",
    "speech_hint": "回应话术应避免空泛道歉，应承诺依法依规调查和公布处理结果。"
  }
}
```

#### 5.2.2 领域关系矩阵

用于加权重排中的 DomainScore 计算。在背景判断字典中维护，定义领域之间的相关程度：

```json
{
  "domain_relations": {
    "文化传播类": { "思想政治教育类": 0.5, "政府管理类": 0.3, "技术分析类": 0.0, "其他": 0.5 },
    "思想政治教育类": { "文化传播类": 0.5, "政府管理类": 0.5, "技术分析类": 0.0, "其他": 0.5 },
    "政府管理类": { "文化传播类": 0.3, "思想政治教育类": 0.5, "技术分析类": 0.3, "其他": 0.5 },
    "技术分析类": { "文化传播类": 0.0, "思想政治教育类": 0.0, "政府管理类": 0.3, "其他": 0.5 },
    "其他": { "文化传播类": 0.5, "思想政治教育类": 0.5, "政府管理类": 0.5, "技术分析类": 0.5 }
  }
}
```

DomainScore 计算规则：
- 相同领域：1.0
- 不同领域：查关系矩阵，取对应值（0.0–0.5）
- 未在矩阵中定义的关系：默认 0.0

### 5.3 CurrentEventProfile 当前事件画像

```ts
export type CurrentEventProfile = {
  event_summary: string
  domain: string
  public_demands: string[]
  heat_level: 1 | 2 | 3 | 4 | 5
  risk_keywords: string[]
  platforms?: string[]
  inferred_strategy_direction?: string[]
  confidence: number
  profile_source: 'llm' | 'rule' | 'manual' | 'mixed'
}
```

前端必须允许用户在生成后修改：领域、公众诉求、热度等级、风险关键词。

#### 5.3.1 置信度计算

`confidence` 字段为启发式估算，仅做展示参考：

- **Mock 模式**：固定返回 0.70–0.85 之间的值。
- **LLM 模式**：根据 JSON 解析成功率计算。成功解析且字段完整时 confidence 较高（0.8–0.95），部分字段缺失或需要 fallback 时较低（0.5–0.7）。
- **手动模式** (`profile_source=manual`)：固定为 1.0。

### 5.4 RetrievedCase 检索结果

```ts
export type RetrievedCase = {
  case_id: number
  title: string
  domain: string
  event_description: string
  strategy_text: string
  semantic_score: number
  demand_score: number
  heat_score: number
  domain_score: number
  effect_score: number
  final_score: number
  explanation: string
}
```

分数字段取值范围 0-1。前端展示为百分比或“高/中/低”。

### 5.5 EvidencePack 证据包

Evidence Pack 是报告生成的唯一证据来源。

```ts
export type EvidencePack = {
  current_event: CurrentEventProfile
  query_text: string
  retrieved_cases: RetrievedCase[]
  dictionary_hints: {
    public_demands: DictItem[]
    heat_level: DictItem
    strategy_types: DictItem[]
  }
  limitations: string[]
}
```

### 5.6 Report 报告

```ts
export type Report = {
  id: number
  input_event_text: string
  profile: CurrentEventProfile
  evidence_pack: EvidencePack
  status: 'draft' | 'generating' | 'ready' | 'failed'
  segments: ReportSegment[]
  created_at: string
  updated_at: string
}

export type ReportSegment = {
  id: number
  report_id: number
  segment_key: 'analysis_and_cases' | 'strategy_and_speech' | 'disclaimer'
  title: string
  content_md: string
  model_name?: string
  generation_status: 'pending' | 'generating' | 'ready' | 'failed'
  regenerated_count: number
  created_at: string
  updated_at: string
}
```

---

## 6. 核心功能需求

## 6.1 工作台 Dashboard

### 6.1.1 目标

展示系统是一个“可运行的 RAG 原型”，而非空壳页面。

### 6.1.2 展示内容

- 案例总数。
- 可检索案例数。
- 已生成向量案例数。
- 最近生成报告数。
- 数据限制提示。
- 系统流程图：

```text
案例素材库 -> 背景判断字典 -> 向量召回 -> 加权重排 -> Evidence Pack -> 分段报告
```

### 6.1.3 验收标准

- [ ] 能看到案例库状态。
- [ ] 能看到系统流程。
- [ ] 能直接跳转到案例素材库和智能生成页。
- [ ] 页面有黑色舞台风格和蓝白线稿背景，不影响内容阅读。

---

## 6.2 案例素材库

### 6.2.1 目标

提供案例管理能力，但不把有限案例数量暴露成弱点。页面应展示精致卡片和少量核心字段。

### 6.2.2 列表展示字段

- 案例名称。
- 所属领域。
- 公众诉求。
- 热度等级。
- 策略类型。
- 处置效果。
- 启用状态。
- 向量状态。

### 6.2.3 列表交互

- 搜索案例名称。
- 按领域筛选。
- 按启用状态筛选。
- 按向量状态筛选。
- 点击卡片打开详情抽屉。

### 6.2.4 详情抽屉

展示：

- 事件核心描述。
- 核心处置策略。
- 标签解释。
- 参与 embedding 的文本预览。
- 是否参与检索。

### 6.2.5 管理功能

| 功能 | 优先级 | 说明 |
|---|---|---|
| 新增案例 | P0 | 手动填写表单 |
| 编辑案例 | P0 | 修改标签、描述、策略 |
| 删除案例 | P0 | 硬删除，二次确认后直接删除数据库记录和关联 embedding |
| 启用/停用案例 | P0 | 不删除但不参与检索 |
| CSV 批量导入 | P0 | 导入当前收集的数据 |
| 重新生成 embedding | P0 | 单条或批量 |
| 查看 embedding 文本 | P1 | 用于调试一致性 |

### 6.2.6 表单字段

新增/编辑案例表单必须包含：

- 案例名称，必填。
- 所属领域，必填。
- 公众诉求，多选，必填。
- 热度等级，1-5，必填。
- 回应速度，可选。
- 处置效果，1-5，可选。
- 策略类型，多选，必填。
- 事件核心描述，必填，建议 50-300 字。
- 核心处置策略，必填，建议 30-200 字。
- 垂直领域字段，可选。
- 备注，可选。

### 6.2.7 验收标准

- [ ] 可以新增一条案例。
- [ ] 可以编辑案例后重新生成 embedding。
- [ ] 停用案例不会出现在检索结果中。
- [ ] CSV 导入后能看到案例数量变化。
- [ ] 页面不展示过多空字段。

---

## 6.3 背景判断字典

### 6.3.1 目标

确保字段判断、向量文本和报告生成使用一致语义，减少“检索逻辑和报告逻辑不一致”。

### 6.3.2 字典类别

- 公众诉求字典。
- 热度等级字典。
- 策略类型字典。
- 领域标签字典。
- 风险关键词字典，可选。

### 6.3.3 字典使用场景

| 场景 | 用法 |
|---|---|
| 案例入库 | 把结构化标签转成自然语言解释，用于 embedding 文本 |
| 事件画像 | 给 LLM 提供判断背景 |
| 检索 query | 把用户输入和标签解释合并为统一 query |
| 报告生成 | 给 LLM 提供章节写作边界 |
| 前端展示 | 鼠标悬浮显示标签解释 |

### 6.3.4 验收标准

- [ ] 后端存在默认字典文件或数据库种子。
- [ ] 生成 embedding 文本时使用字典解释。
- [ ] 生成报告 Prompt 时使用字典提示。
- [ ] 前端可在设置页或详情抽屉查看字典解释。

---

## 6.4 智能生成页

### 6.4.1 目标

完成主要演示流程：输入当前事件 → 画像 → 检索 → 生成报告。

### 6.4.2 输入区

用户输入：

- 当前舆情事件描述，必填，建议 50-800 字。
- 可选字段：领域、公众诉求、热度等级、传播平台。

输入区应提供示例按钮：

- 高校食堂卫生问题。
- 景区 NPC 互动争议。
- 政务通报信息不透明。

### 6.4.3 事件画像区

点击“生成事件画像”后，展示：

- 事件摘要。
- 所属领域。
- 公众诉求。
- 热度等级。
- 风险关键词。
- 建议策略方向。
- 置信度。

用户可以修改画像字段。修改后，后续检索使用用户确认后的画像。

### 6.4.4 检索结果区

点击“检索参考案例”后，展示 Top-K 案例，默认 Top-3。

每张卡片显示：

- 案例名称。
- 参考匹配度。
- 相似度拆解。
- 推荐理由。
- 核心处置策略。
- 历史效果评分。

### 6.4.5 报告生成入口

点击“生成三段式报告”后：

- 后端创建 report。
- 分段生成三个 segment。
- 前端跳转到报告编辑页 `/reports/:id`，在该页面显示分段生成进度。

### 6.4.6 验收标准

- [ ] 输入事件后能生成画像。
- [ ] 用户能手动修改画像。
- [ ] 检索结果至少返回 1 条可用案例，除非案例库为空。
- [ ] 检索卡片有解释，不只显示分数。
- [ ] 生成报告使用 Evidence Pack，不使用原始输入直接空写。

---

## 6.5 RAG 检索需求

### 6.5.1 总体流程

```text
当前事件输入
  -> 事件画像 CurrentEventProfile
  -> 背景判断字典补充解释
  -> 构造 query_text
  -> 调用 embedding 模型生成 query vector
  -> 从 enabled + ready 案例中向量召回 Top-N
  -> 计算结构化匹配分
  -> 加权重排
  -> 生成 Top-K RetrievedCase
  -> 生成 Evidence Pack
```

### 6.5.2 Query Text 构造规则

不得直接把用户原始输入送入 embedding。必须构造标准化检索文本。

示例：

```text
当前事件：某高校食堂被曝食品卫生问题，学生在社交平台发布图片后引发大量转发。
所属领域：思想政治教育类。
公众诉求：要求信息公开、要求问责。要求信息公开表示公众关注事实、时间线和处置进展是否透明；要求问责表示公众关注责任主体和处理结果。
热度等级：4，高热度，需快速发布阶段性说明。
风险关键词：高校、学生群体、食品安全、图片传播、校方回应。
检索目标：寻找相似历史案例及可借鉴处置策略。
```

### 6.5.3 向量召回

- 默认从所有 `enabled=true` 且 `embedding_status=ready` 的案例中召回。
- 不强制同领域过滤，避免小样本无结果。
- 可以使用“同领域加分”而不是“同领域硬过滤”。
- 默认召回 Top-N = 10，最终展示 Top-K = 3。

### 6.5.4 加权重排公式

```text
FinalScore =
0.45 * SemanticScore
+ 0.20 * DemandScore
+ 0.15 * HeatScore
+ 0.10 * DomainScore
+ 0.10 * EffectScore
```

#### 分数说明

| 分数 | 计算建议 | 含义 |
|---|---|---|
| SemanticScore | query vector 与 case vector 的 cosine similarity 归一化 | 文本语义相似 |
| DemandScore | 公众诉求集合 Jaccard 或重合度 | 诉求是否一致 |
| HeatScore | `1 - abs(query_heat - case_heat) / 4` | 热度等级是否接近 |
| DomainScore | 同领域 1，不同领域查字典关系矩阵取值，未定义关系 0 | 领域是否一致 |
| EffectScore | `effect_score / 5`，缺失时 0.6 | 历史策略效果参考 |

前端展示名使用“参考匹配度”，不要叫“准确率”。

### 6.5.5 验收标准

- [ ] 检索过程保存 RetrievalRun 日志。
- [ ] 每条结果包含拆解分。
- [ ] 小样本情况下不能因为同领域不足直接无结果。
- [ ] 分数异常时有 fallback。

---

## 6.6 Evidence Pack 需求

### 6.6.1 目标

Evidence Pack 是报告生成的唯一材料，防止模型乱编。

### 6.6.2 内容

必须包含：

- 当前事件画像。
- 构造后的 query_text。
- Top-K 参考案例摘要。
- 每个参考案例的相似原因。
- 背景字典提示。
- 数据限制。

不得包含：

- 未经确认的全网数据。
- 虚构的传播量、阅读量、转发量。
- 不在案例库中的具体历史事件细节。

### 6.6.3 验收标准

- [ ] 后端能单独返回 Evidence Pack。
- [ ] 报告页可查看“本段依据”。
- [ ] LLM Prompt 中明确要求“只基于 Evidence Pack”。

---

## 6.7 三段式报告生成

### 6.7.1 章节结构

最终报告固定为三段：

```text
一、舆情画像与历史案例参考
二、处置结论与回应话术
三、免责声明与使用边界
```

### 6.7.2 第一段：舆情画像与历史案例参考

目标：把当前事件分析和历史案例放在一起，减少报告章节，提升信息密度。

必须包含：

- 当前事件类型判断。
- 主要公众诉求。
- 风险等级判断。
- Top-K 案例参考价值。
- 一句“为什么这些案例可参考”。

禁止：

- 虚构热搜排名、转发量、阅读量。
- 声称系统完成了全网监测。
- 写成超过 800 字的长篇研判。

### 6.7.3 第二段：处置结论与回应话术

目标：给出可执行建议和简洁回应话术。

必须包含：

- 推荐处置方向。
- 首轮回应重点。
- 后续补救动作。
- 至少一段回应话术。
- 避免事项。

回应话术要求：

- 不代表真实机构发布最终结论。
- 不承诺未调查清楚的事实。
- 尽量使用“阶段性说明”“持续更新”“依法依规核查”等稳健表达。

### 6.7.4 第三段：免责声明与使用边界

目标：明确系统限制。

必须包含：

- 小样本案例库限制。
- 模型生成限制。
- 不构成真实决策依据。
- 需要人工复核。

建议字数：80-180 字。

### 6.7.5 局部重生成

每个段落旁边必须有“重新生成本段”功能。重生成时只调用对应段落的生成接口，不影响其他段落。

### 6.7.6 报告导出

P0：导出 Markdown。  
P1：导出 `.docx`。  
P2：导出 PDF。

### 6.7.7 验收标准

- [ ] 报告只有三段，不出现多余章节。
- [ ] 每段由独立 LLM 调用生成。
- [ ] 每段可以单独重新生成。
- [ ] 第一段引用 Top-K 案例但不堆完整原文。
- [ ] 第二段有实际话术。
- [ ] 第三段明确限制。

---

## 6.8 设置与调试页

### 6.8.1 内容

- 当前是否启用 Mock 模式。
- Embedding 模型名。
- LLM 快速模型名。
- LLM 审查/润色模型名。
- 检索权重配置。
- 背景判断字典查看。
- API Key 状态只显示“已配置/未配置”，不得显示真实 key。

### 6.8.2 验收标准

- [ ] 前端不显示真实 API Key。
- [ ] 能查看检索权重。
- [ ] 能查看默认字典。

---

## 6.9 简单评估页 P1

### 6.9.1 目标

用轻量方式体现数学建模项目的验证意识，不做严格因果推断。

### 6.9.2 功能

- 选择 3-5 条固定测试事件。测试事件由后端 `seed.py` 内置维护，前端通过 `POST /api/evaluation/run-demo` 获取可用事件列表。
- 运行检索。
- 展示 Top-K 案例。
- 展示人工评分表：相关性、可操作性、风险控制、表达质量。

### 6.9.3 指标

| 指标 | 含义 |
|---|---|
| Top-3 同领域命中 | Top-3 是否包含同领域案例 |
| 平均参考匹配度 | Top-3 final_score 均值 |
| 人工相关性评分 | 1-5 |
| 人工可操作性评分 | 1-5 |

### 6.9.4 验收标准

- [ ] 能运行固定测试。
- [ ] 能展示分数，不要求保存复杂统计。
- [ ] 页面明确“仅为课程原型验证”。

---

## 7. 前后端接口需求概览

详细接口在 `ZhiXi_Backend.md`，这里列出 PRD 层级必须存在的 API。

```text
GET    /api/health
GET    /api/dashboard/summary

GET    /api/cases
POST   /api/cases
GET    /api/cases/{case_id}
PUT    /api/cases/{case_id}
DELETE /api/cases/{case_id}
POST   /api/cases/import-csv
POST   /api/cases/{case_id}/embedding
POST   /api/cases/rebuild-embeddings
POST   /api/cases/{case_id}/toggle

GET    /api/dictionaries
POST   /api/events/profile
POST   /api/rag/retrieve
POST   /api/rag/evidence-pack

POST   /api/reports
GET    /api/reports/{report_id}
POST   /api/reports/{report_id}/segments/{segment_key}/regenerate
GET    /api/reports/{report_id}/export.md

GET    /api/settings/public
POST   /api/evaluation/run-demo
```

---

## 8. 前端完成定义

前端视为完成，需要满足：

- [ ] 页面路由完整：工作台、案例库、智能生成、报告页、设置页。
- [ ] 核心流程可从 UI 完整跑通。
- [ ] 有统一设计风格，不是默认模板。
- [ ] 支持 loading、error、empty、success 状态。
- [ ] 关键按钮有 disabled 状态，防止重复提交。
- [ ] 所有 API 调用通过统一 client。
- [ ] 不在前端硬编码 API Key。
- [ ] 报告页支持三段局部重生成。
- [ ] 检索卡片展示相似度拆解。

---

## 9. 后端完成定义

后端视为完成，需要满足：

- [ ] FastAPI 启动后 `/docs` 可访问。
- [ ] SQLite 数据库自动初始化。
- [ ] CSV 导入能清理空列并保存案例。
- [ ] 可以新增、编辑、删除、启用/停用案例。
- [ ] 可以生成和保存 embedding。
- [ ] 检索接口返回 Top-K 和分数拆解。
- [ ] Evidence Pack 可单独返回。
- [ ] 报告分段生成接口可用。
- [ ] 无 API Key 时支持 Mock 模式。
- [ ] 关键调用保存日志。

---

## 10. 演示脚本

### 10.1 标准演示路径

1. 打开工作台：介绍系统定位和数据限制。
2. 打开案例素材库：展示历史案例素材、启用状态、向量状态。
3. 新增或导入一条案例：展示产品完整性。
4. 打开智能生成页：输入“高校食堂卫生问题”示例。
5. 生成事件画像：展示系统判断领域、诉求、热度。
6. 检索参考案例：展示 Top-3 和相似度拆解。
7. 生成报告：展示三段式报告。
8. 重新生成第二段：展示分段生成能力。
9. 导出 Markdown。
10. 展示免责声明：强调原型边界。

### 10.2 推荐输入示例

```text
某高校食堂被曝食品卫生问题，学生在社交平台发布图片后引发大量转发，评论区集中要求学校公开调查结果并追责相关负责人。学校目前尚未发布正式通报，校内学生情绪较为集中。
```

---

## 11. 风险与约束

| 风险 | 表现 | 处理方式 |
|---|---|---|
| 案例数量少 | 检索结果可能不稳定 | 弱过滤 + 加权重排 + 明确限制 |
| LLM 幻觉 | 编造传播数据 | Evidence Pack + Prompt 禁止 + 审查 |
| 风格过度 | UI 影响可读性 | 黑色舞台只做外框，内容区保持高对比 |
| 接口不一致 | 前后端字段错位 | 使用 OpenAPI 生成 TS 类型 |
| API Key 不可用 | 演示失败 | Mock 模式和固定样例 |

---

## 12. 版本路线

### V0.1 原型

- 后端 SQLite + FastAPI。
- 案例导入与检索。
- 基础报告生成。
- 前端主流程。

### V0.2 演示版

- 完整设计风格。
- 三段式报告。
- 局部重生成。
- 检索解释。
- Mock 模式。

### V0.3 拓展版

- 简单评估页。
- docx 导出。
- 更完善的字典编辑。
- LangChain adapter 可选。

---

## 13. 一致性规则

后续文档必须遵守以下规则：

1. 报告固定三段式，不回到长报告结构。
2. SQLite 是默认数据库，不引入 Postgres/pgvector 作为必需项。
3. LangChain 可选，不作为核心架构强依赖。
4. 案例库是“小样本策略素材库”，不是“大规模舆情数据库”。
5. 前端必须有黑色舞台、蓝白线稿、几何标注、报告画布的统一风格。
6. 所有模型调用必须支持 Mock fallback。
7. 不允许前端暴露 API Key。
8. 不允许报告声称真实全网监测或严格因果证明。
