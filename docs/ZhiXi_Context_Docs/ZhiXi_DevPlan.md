# ZhiXi_DevPlan.md

> 文档版本：v0.4
> 目标：把 PRD、Frontend、Backend、Tech、Test 转化为可执行开发计划。
> 原则：先闭环后美化；先 Mock 后真实模型；先 P0 后 P1。
> **本文不包含完整代码实现**，具体契约见 Backend/Frontend 文档。

---

## 1. 开发总路线

```text
阶段 0：Git + .gitignore + 首次提交           ✅ 已完成
阶段 1：后端 schemas + API 路由 + 注册        ✅ 已完成
阶段 2：后端 services + utils + 脚本          ✅ 已完成（28 条案例已导入）
阶段 3：RAG 管线集成验证                       ← 当前
阶段 4：前端 AppShell + 视觉系统
阶段 5：前端案例库 UI
阶段 6：前端智能生成 UI
阶段 7：前端报告页 UI
阶段 8：前端设置页 + 评估页 + 工作台
阶段 9：全面测试
阶段 10：演示打磨
```

---

## 2. 阶段 0–2：已完成（基础架构）

阶段 0–2 产出：根 `.gitignore`、首次 git commit、7 个 Pydantic schema、9 个 API 路由、10 个 Service、3 个 Utils、2 个 CLI 脚本、Mock embedding + LLM 客户端、21 条字典数据、3 条 demo event、28 条案例从 CSV 导入。

---

## 3. 阶段 3：RAG 管线集成验证

### 3.1 目标

端到端验证：事件输入 → 画像 → query_text → 向量召回 → 加权重排 → Evidence Pack → 三段式报告。当前各 service 已独立存在但未串联端到端。

### 3.2 任务

1. **验证 `/api/events/profile`**：输入 `data/Sheet1.csv` 中的一条事件文本 → 返回 CurrentEventProfile（domain, demands, heat, confidence, risk_keywords）。Mock 模式使用关键词规则。
2. **验证 `/api/rag/retrieve`**：使用 profile 调用检索 → 返回 Top-3，每条含 5 子分数 + final_score + explanation。验证停用案例不出现、Top-K 按 final_score 降序。
3. **验证 `/api/rag/evidence-pack`**：返回完整 Evidence Pack（current_event + query_text + retrieved_cases + dictionary_hints + limitations）。
4. **验证 `/api/reports`**：创建报告 → 3 个 segment 独立生成 → 每段 content_md 非空。
5. **验证局部重生成**：`POST /api/reports/{id}/segments/strategy_and_speech/regenerate` → 仅该段变化。
6. **验证 Markdown 导出**：`GET /api/reports/{id}/export.md` → 包含三个固定标题。

### 3.3 验收

- [ ] 输入 PRD 示例事件文本（高校食堂卫生问题）→ profile 返回 domain=思想政治教育类, heat≥3
- [ ] retrieve 返回 results，每条有 6 个分数（5 子 + final）且 final=0.45*sem+0.20*dem+0.15*heat+0.10*dom+0.10*eff
- [ ] 同域案例 domain_score=1.0，不同域查字典矩阵
- [ ] evidence-pack 返回 3 条 limitations
- [ ] 报告 3 段各自独立生成，Mock 输出不同内容
- [ ] 重新生成第 2 段 → 第 1/3 段不变
- [ ] Markdown 导出包含 `## 一、舆情画像与历史案例参考` `## 二、处置结论与回应话术` `## 三、免责声明与使用边界`

---

## 4. 阶段 4：前端 AppShell + 视觉系统

### 4.1 目标

建立前端架构骨架和统一视觉风格。页面可导航、有黑色舞台背景、有蓝图线稿元素。

### 4.2 组件规格

#### `AppShell`

| 维度 | 规格 |
|---|---|
| **Props** | `children: React.ReactNode` |
| **职责** | 全局布局容器，包含 Sidebar + TopBar + `<main>` |
| **状态** | 始终渲染（无 loading/error/empty） |
| **交互** | 无直接交互，子组件各自处理 |
| **布局** | `grid grid-cols-[240px_1fr]`，Sidebar 固定宽 |

#### `Sidebar`

| 维度 | 规格 |
|---|---|
| **Props** | 无（从 React Router `useLocation` 获取当前路由） |
| **职责** | 6 个导航项 + ZhiXi logo，当前路由高亮 |
| **项** | 工作台(/)、案例素材库(/cases)、智能生成(/generate)、报告编辑(/reports/:id)、设置(/settings)、评估(/evaluation) |
| **高亮** | `useLocation().pathname` 匹配 → `--zx-blue` 左边框 |

#### `TopBar`

| 维度 | 规格 |
|---|---|
| **Props** | 无（从 `useQuery('settings')` 获取 mock 状态） |
| **职责** | 右侧显示 Mock 模式指示灯（绿色圆点 + "Mock 模式" 文字或红色圆点 + "真实模型"） |
| **数据** | `GET /api/settings/public` → `mock_mode` |

#### `StageBackground`

| 维度 | 规格 |
|---|---|
| **Props** | 无 |
| **职责** | 全屏黑色径向渐变背景 + 低透明度点阵噪声 |
| **定位** | `fixed inset-0 -z-10` |
| **颜色** | `--zx-bg` 渐变，点阵 opacity 0.06 |

#### `BlueprintGrid`

| 维度 | 规格 |
|---|---|
| **Props** | `opacity?: number`（默认 0.12） |
| **职责** | SVG `<pattern>` 网格 + 圆形坐标标注 + 蓝色细线 |
| **定位** | `absolute inset-0 pointer-events-none` |

#### `ReportCanvas`

| 维度 | 规格 |
|---|---|
| **Props** | `children: React.ReactNode` |
| **职责** | 白灰画布容器，报告内容区域 |
| **样式** | `bg-[--zx-canvas]` + 轻微蓝色外发光阴影 + 淡网格纹理 |
| **圆角** | `rounded-sm` |

### 4.3 其他基础设施文件

| 文件 | 职责 |
|---|---|
| `src/app/providers.tsx` | QueryClientProvider + TooltipProvider + BrowserRouter 嵌套 |
| `src/app/router.tsx` | 6 条 Route 包裹在 AppShell 内 |
| `src/styles/tokens.css` | 全部 CSS 自定义属性（--zx-bg, --zx-canvas, --zx-blue 等，见 Frontend.md §3.1） |
| `src/styles/globals.css` | `@import "tailwindcss"` + body 基础样式 |
| `src/lib/format.ts` | `formatPercent(n: number): string`（0.82 → "82%"）、`formatDate(iso: string): string`、`formatScoreLabel(n: number): string`（>0.8 → "高" 等） |
| `src/lib/scores.ts` | `ScoreBreakdown` 类型 + `SCORE_LABELS` 常量（semantic→"语义相似度" 等） |
| `src/lib/constants.ts` | `DOMAIN_OPTIONS`、`HEAT_OPTIONS`、`DEMAND_OPTIONS`、`STRATEGY_OPTIONS` |
| `src/api/cases.ts` | `fetchCases(filters)`、`fetchCase(id)`、`createCase(data)`、`updateCase(id, data)`、`deleteCase(id)`、`importCsv(file)`、`toggleCase(id)` — 全部通过 `apiFetch` |
| `src/api/rag.ts` | `generateProfile(eventText, hints?)`、`retrieveCases(eventText, profile, topK?)`、`buildEvidencePack(eventText, profile, topK?)` |
| `src/api/reports.ts` | `createReport(data)`、`fetchReport(id)`、`regenerateSegment(id, key)`、`exportMarkdown(id)` |
| `src/api/settings.ts` | `fetchPublicSettings()` |

### 4.4 验收

- [ ] 6 条路由均可导航，URL 变化时 Sidebar 高亮正确
- [ ] 黑色舞台背景 + 点阵纹理可见
- [ ] 蓝图网格 SVG 存在但不遮挡文字
- [ ] TopBar 显示 Mock 模式状态
- [ ] `pnpm build` 通过

---

## 5. 阶段 5：前端案例库 UI（/cases）

### 5.1 目标

完整 CRUD + CSV 导入 + embedding 管理的案例素材库页面。

### 5.2 页面组件树

```text
CaseLibraryPage
  ├── CaseToolbar
  │     ├── [新增案例] Button → 打开 CaseFormDialog (mode="create")
  │     ├── [导入 CSV] Button → <input type="file" accept=".csv">
  │     └── [批量重建 Embedding] Button
  ├── CaseFilterRail
  │     ├── 搜索框 (Input, 案例名称)
  │     ├── 领域 Select (全部 / 四大领域)
  │     ├── 启用状态 Select (全部 / 已启用 / 已停用)
  │     └── 向量状态 Select (全部 / none / pending / ready / failed)
  └── CaseCardGrid
        └── CaseCard[] (每个一张卡片)
```

### 5.3 组件规格

#### `CaseLibraryPage`

| 维度 | 规格 |
|---|---|
| **数据** | `useCases(filters)` → `{items, total, page, page_size}` |
| **状态** | loading: 12 个 Skeleton 卡片；empty: "暂无案例素材，导入 CSV 或新增案例"；error: toast + 重试按钮 |
| **分页** | 底部分页器（page/page_size） |

#### `CaseCard`

| 维度 | 规格 |
|---|---|
| **Props** | `case: CaseResponse`, `onClick: () => void`, `onToggle: () => void` |
| **展示** | 标题、领域 Badge（颜色按领域）、热度等级 Badge（1-5 数字）、向量状态 Badge（ready=绿/none=灰/failed=红）、公众诉求 Chips（最多 3 个）、处置效果 RatingDots（●○○○○） |
| **交互** | 点击卡片 → 打开 `CaseDetailDrawer`；Switch 切换启用/停用 |
| **状态** | 停用卡片整体 opacity 降低 + 遮罩条纹 |

#### `CaseDetailDrawer`

| 维度 | 规格 |
|---|---|
| **Props** | `caseId: number`, `open: boolean`, `onClose: () => void` |
| **展示** | Sheet 从右侧滑入：事件核心描述、核心处置策略、所有标签 + 悬浮解释（字典释义）、Embedding 文本预览（`<pre>` 等宽字体）、是否参与检索（enabled + embedding_status 联合判断） |
| **操作** | [编辑] → 打开 CaseFormDialog(mode="edit")；[重新生成 Embedding] |
| **状态** | loading: Skeleton；error: 抽屉内 error panel |

#### `CaseFormDialog`

| 维度 | 规格 |
|---|---|
| **Props** | `mode: 'create' | 'edit'`, `case?: CaseResponse`, `open: boolean`, `onClose: () => void` |
| **表单** | React Hook Form + Zod schema（见 `case.schema.ts`）：title 必填、domain 枚举必选、public_demands 多选 Chips、heat_level 1-5 SegmentedControl、effect_score 1-5 RatingDots、strategy_types 多选 Chips、event_description textarea（50-300 字建议）、strategy_text textarea（30-200 字建议） |
| **验证** | title 非空、domain 非空、至少选 1 个 public_demand |
| **状态** | 提交中按钮 disabled + loading spinner；校验失败字段下方红色提示 |
| **交互** | 关闭时如有未保存修改 → 二次确认弹窗 |

#### `EmbeddingPreview`

| 维度 | 规格 |
|---|---|
| **Props** | `embedding: { text: string, model: string, dimensions: number } | null` |
| **展示** | 等宽字体展示 embedding_text 全文，下方显示 model + dimensions |
| **状态** | null → "尚未生成向量"；ready → 文本展示 + 向量维度信息 |

### 5.4 验收

- [ ] 卡片网格展示所有案例（当前 28 条）
- [ ] 领域筛选 → 卡片数量变化
- [ ] 搜索案例名称 → 模糊匹配
- [ ] 新增案例弹窗：所有必填字段可填写、校验生效
- [ ] 编辑案例后 embedding_status 变为 "none"
- [ ] 删除案例 → 二次确认 → 卡片消失
- [ ] 启用/停用 Switch → 即时生效
- [ ] CSV 导入 → 文件选择 → toast "导入 N 条"
- [ ] 重新生成 Embedding → 状态变为 "ready"
- [ ] 抽屉内 EmbeddingPreview 展示向量文本
- [ ] 空状态（无案例时）有引导操作
- [ ] loading 状态有 Skeleton 卡片
- [ ] error 状态有 toast + 重试

---

## 6. 阶段 6：前端智能生成 UI（/generate）

### 6.1 目标

完成主演示流程：输入事件 → 画像 → 检索 → 报告生成 → 跳转。

### 6.2 页面组件树

```text
GeneratePage
  ├── EventInputPanel
  │     ├── Textarea (50-800 字，带字数统计)
  │     ├── ExamplePromptBar (3 个示例按钮：高校食堂/景区NPC/政务通报)
  │     └── [生成事件画像] Button → POST /api/events/profile
  ├── ProfileEditor
  │     ├── 事件摘要 (只读)
  │     ├── 所属领域 (Select 可编辑)
  │     ├── 公众诉求 (Chips 可编辑多选)
  │     ├── 热度等级 (SegmentedControl 1-5)
  │     ├── 风险关键词 (Tags 可编辑)
  │     ├── 置信度 (只读进度条)
  │     └── [检索参考案例] Button → POST /api/rag/retrieve
  ├── RetrievalTimeline (检索中扫描线动效，600ms)
  ├── RetrievedCaseCard[] (Top-K 卡片，默认 3 张)
  │     └── SimilarityBreakdown (每个卡片内的 5 子分数)
  ├── EvidencePackDrawer (查看完整 Evidence Pack)
  └── [生成三段式报告] Button → POST /api/reports → navigate(/reports/:id)
```

### 6.3 组件规格

#### `EventInputPanel`

| 维度 | 规格 |
|---|---|
| **Props** | `value: string`, `onChange: (v: string) => void`, `onSubmit: () => void`, `isLoading: boolean` |
| **验证** | 50-800 字符，实时字数统计 `{current}/800`（<50 时红色） |
| **示例** | 3 个预设示例按钮，点击自动填入 textarea |
| **按钮** | [生成事件画像] 在 `isLoading` 或字数不达标时 disabled |

#### `ProfileEditor`

| 维度 | 规格 |
|---|---|
| **Props** | `profile: CurrentEventProfile | null`, `onUpdate: (patch: Partial<CurrentEventProfile>) => void`, `onRetrieve: () => void`, `isRetrieving: boolean` |
| **可编辑字段** | domain（Select）、heat_level（SegmentedControl）、public_demands（Chips 多选）、risk_keywords（Input + Tag 增减） |
| **只读字段** | event_summary、confidence（进度条 + 百分比）、profile_source |
| **状态** | profile=null → "尚未生成画像" 占位；任何字段修改后 → patch 保存到本地 state |

#### `RetrievedCaseCard`

| 维度 | 规格 |
|---|---|
| **Props** | `result: RetrievedCaseItem` |
| **展示** | 案例名称、领域 Badge、final_score（大号等宽字体 + 百分比）、匹配等级标签（高/中/低，>0.8 绿色、0.5-0.8 黄色、<0.5 灰色）、explanation 文本、核心策略摘要（最多 3 行折叠） |
| **子组件** | 内嵌 `SimilarityBreakdown` |
| **交互** | 展开/折叠查看完整策略文本 |

#### `SimilarityBreakdown`

| 维度 | 规格 |
|---|---|
| **Props** | `scores: { semantic, demand, heat, domain, effect }`，`final: number` |
| **展示** | 5 条子分数横向或纵向条形图：标签（中文） + 百分比 + 进度条（`--zx-blue` 填充），按权重降序排列（语义>诉求>热度>领域>效果） |
| **状态** | 任一分数缺失 → 显示 "—" |

#### `EvidencePackDrawer`

| 维度 | 规格 |
|---|---|
| **Props** | `evidencePack: EvidencePackResponse | null`, `open: boolean`, `onClose: () => void` |
| **展示** | query_text 全文、Top-K 案例摘要、dictionary_hints 摘要、limitations 列表（红色文字强调） |
| **交互** | 从右侧滑入 Sheet |

### 6.4 页面状态机

```text
初始 (event_text="")
  → 输入文本 → [生成事件画像] 可用
  → 点击 [生成事件画像] → profileLoading=true → 画像区 Skeleton
  → profile ready → ProfileEditor 展示 + [检索参考案例] 可用
  → 用户可选编辑画像字段（修改后 patch 保存）
  → 点击 [检索参考案例] → retrieveLoading=true → RetrievalTimeline 动效
  → results ready → Top-K 卡片 + SimilarityBreakdown
  → [生成三段式报告] 可用（无 results 时 disabled）
  → 点击 → navigate(`/reports/${reportId}`)
```

### 6.5 验收

- [ ] 输入 PRD 示例文本 "高校食堂卫生问题……" → 生成画像 → domain=思想政治教育类
- [ ] 画像字段可编辑：修改 domain → 检索结果相应变化
- [ ] 检索结果 3 张卡片，每张含 5 子分数 + final_score
- [ ] SimilarityBreakdown 分数以百分比展示
- [ ] 证据抽屉可查看完整 Evidence Pack
- [ ] [生成三段式报告] 按钮 → 跳转到 `/reports/:id`
- [ ] 无检索结果时 [生成报告] 按钮 disabled
- [ ] 字数统计实时更新，<50 时红色警告
- [ ] loading 状态有 RetrievalTimeline 扫描动效

---

## 7. 阶段 7：前端报告页 UI（/reports/:id）

### 7.1 目标

三段式报告展示、局部重生成、复制、导出、Evidence 查看。

### 7.2 页面组件树

```text
ReportPage
  ├── ReportCanvas (白灰画布)
  │     ├── ReportSegmentCard (一、舆情画像与历史案例参考)
  │     │     └── SegmentActionBar
  │     ├── ReportSegmentCard (二、处置结论与回应话术)
  │     │     └── SegmentActionBar
  │     ├── ReportSegmentCard (三、免责声明与使用边界)
  │     │     └── SegmentActionBar
  │     └── ExportReportButton → GET /api/reports/{id}/export.md
  └── EvidenceInspector (右侧栏)
        └── Evidence Pack 摘要
```

### 7.3 组件规格

#### `ReportPage`

| 维度 | 规格 |
|---|---|
| **数据** | `useReport(id)` → `ReportResponse` |
| **状态** | loading: 3 个 Skeleton 段落卡片；error: "报告加载失败" + 重试；empty: 404 跳转到 /generate |
| **布局** | `grid grid-cols-[1fr_320px]`：左 ReportCanvas + 右 EvidenceInspector |

#### `ReportSegmentCard`

| 维度 | 规格 |
|---|---|
| **Props** | `segment: ReportSegmentResponse`, `onRegenerate: () => void` |
| **展示** | 标题（h2）、Markdown 内容（用 `react-markdown` 或 `dangerouslySetInnerHTML` 渲染）、model_name 脚注 |
| **状态** | pending: "等待生成…" + Skeleton；generating: Spinner + "生成中…"；ready: 完整 Markdown 渲染；failed: 红色 "生成失败" + [重试] 按钮 |
| **交互** | 不提供文本编辑框（不支持手动编辑） |

#### `SegmentActionBar`

| 维度 | 规格 |
|---|---|
| **Props** | `segmentKey: string`, `onRegenerate: () => void`, `onCopy: () => void`, `onViewEvidence: () => void` |
| **按钮** | [重新生成]（loading 时 disabled）、[复制本段]（复制后 toast "已复制"）、[查看依据]（打开 EvidencePackDrawer） |

#### `EvidenceInspector`

| 维度 | 规格 |
|---|---|
| **Props** | `evidencePack: EvidencePackResponse` |
| **展示** | 当前事件摘要、Top-K 案例列表（名称 + final_score）、limitations 红色警示 |

#### `ExportReportButton`

| 维度 | 规格 |
|---|---|
| **Props** | `reportId: number` |
| **行为** | 点击 → `GET /api/reports/{id}/export.md` → 触发浏览器下载 `.md` 文件 |

### 7.4 验收

- [ ] 报告页面展示 3 个段落卡片
- [ ] 每段可独立重新生成 → loading → 内容更新
- [ ] 重新生成第 2 段 → 第 1/3 段不变
- [ ] 每段可复制（toast 确认）
- [ ] 每段可查看依据（EvidencePackDrawer）
- [ ] 导出 Markdown 按钮 → 文件下载
- [ ] 右侧 EvidenceInspector 展示匹配案例
- [ ] 报告不支持手动文本编辑（无 textarea/input）
- [ ] pending/generating/ready/failed 四种状态均正确展示

---

## 8. 阶段 8：前端设置页 + 评估页 + 工作台

### 8.1 DashboardPage（/）

| 维度 | 规格 |
|---|---|
| **数据** | `useQuery('dashboard-summary', () => apiFetch('/api/dashboard/summary'))` |
| **状态** | loading: 4 个 Skeleton MetricCards；error: error panel + 重试 |
| **组件** | `HeroStage`（标题 + CTA 按钮）、`MetricCards`（案例总数/可检索/已向量化/报告数）、`PipelineBlueprint`（SVG 流程图：6 节点 + 连线）、`LimitNotice`（小样本限制提示） |

### 8.2 SettingsPage（/settings）

| 维度 | 规格 |
|---|---|
| **数据** | `useQuery('settings', fetchPublicSettings)` |
| **状态** | loading: Skeleton 卡片；error: toast |
| **布局** | 左列：Mock 模式 Badge + 模型名（只读）+ API Key 状态指示灯（绿圆/红圆 + "已配置"/"未配置"）；右列：检索权重表（6 行 × 3 列）+ 字典 Accordion（按类别折叠展开） |
| **禁止** | 绝不显示真实 Key 值 |

### 8.3 EvaluationPage（/evaluation）

| 维度 | 规格 |
|---|---|
| **数据** | 左列 DemoEventRail → 3 个预设事件按钮（golden_event_1/2/3）；点击 → `POST /api/evaluation/run-demo` |
| **状态** | 初始："选择测试事件"；running: Spinner + "评估中…"；结果：profile 摘要 + Top-K 案例卡片 + metrics（average_final_score, has_same_domain_hit）+ ManualScoreForm（4 个 1-5 Slider：相关性/可操作性/风险控制/表达质量） |
| **提示** | 页面底部 "仅为课程原型验证" |

### 8.4 验收

- [ ] 工作台展示实时案例/报告数量
- [ ] 工作台 SVG 流程图可展示 RAG 链路
- [ ] 设置页 Key 状态正确（Mock 模式均为 "未配置"）
- [ ] 设置页权重表与 `GET /api/settings/public` 一致
- [ ] 设置页字典可逐类别展开
- [ ] 评估页 3 个测试事件可选择运行
- [ ] 评估页展示 Top-K 和指标
- [ ] 评估页可录入人工评分

---

## 9. 阶段 9：全面测试

### 9.1 测试总原则

- 每个 API 端点：**≥1 成功用例 + ≥2 异常用例**（404+422 或 400+500）
- 每个前端组件：**覆盖五态**（loading / error / empty / success / disabled）
- RAG 管线：**正确性验证**（公式、数据源、Prompt 安全）
- E2E：**完整演示路径**（PRD §10.1 的 10 步）

### 9.2 后端 API 测试矩阵

| API 端点 | 成功用例 | 异常用例 |
|---|---|---|
| `GET /api/health` | 返回 `{status:"ok", mock_mode, database}` | — |
| `GET /api/dashboard/summary` | 返回 5 个字段，类型正确 | 无数据时各字段为 0 |
| `GET /api/cases` | 分页列表 + 筛选 domain/enabled/embedding_status | page=0 → 422，page_size=999 → 422 |
| `POST /api/cases` | 创建成功 201 | title 空 → 422，domain 非法枚举 → 422，heat_level=0 → 422 |
| `GET /api/cases/{id}` | 返回案例 | id=99999 → 404 `CASE_NOT_FOUND` |
| `PUT /api/cases/{id}` | 更新 + embedding_status→"none" | id=99999 → 404，非法 heat_level → 422 |
| `DELETE /api/cases/{id}` | 204 + 级联删除 embedding | id=99999 → 404 |
| `POST /api/cases/import-csv` | 导入成功 → imported>0 | 空文件 → skipped，非 CSV → 500 |
| `POST /api/cases/{id}/toggle` | 切换 enabled | id=99999 → 404 |
| `POST /api/cases/{id}/embedding` | 生成向量 → status="ready" | id=99999 → 404，已 ready → 重新生成覆盖 |
| `POST /api/cases/rebuild-embeddings` | 批量重建 → rebuilt>=0 | 无案例 → rebuilt=0 |
| `GET /api/dictionaries` | 5 类别非空 | — |
| `POST /api/events/profile` | 返回 profile + confidence | event_text<50 → 422，event_text>800 → 422 |
| `POST /api/rag/retrieve` | Top-K + 6 分数 | 无 ready 案例 → 空 results |
| `POST /api/rag/evidence-pack` | 含 limitations | — |
| `POST /api/reports` | 201 + 3 segments | 无效 profile → 422 |
| `GET /api/reports/{id}` | 返回完整报告 | id=99999 → 404 |
| `POST /api/reports/{id}/segments/{key}/regenerate` | 仅该段更新 | 无效 key → 404 |
| `GET /api/reports/{id}/export.md` | 返回 MD 文本 | id=99999 → 404 |
| `GET /api/settings/public` | 返回配置 | 绝不返回真实 Key（断言 values 不含 `sk-` 或 `api-` 前缀） |
| `POST /api/evaluation/run-demo` | golden_event_1/2/3 均返回 | 无效 demo_event_id → error message |

### 9.3 RAG 管线正确性测试

**分数计算验证：**

| 测试 | 预期 |
|---|---|
| `demand_score(["A","B"], ["A","B"])` | 1.0（完全匹配） |
| `demand_score(["A","B"], ["A"])` | 0.5（部分匹配） |
| `demand_score([], [])` | 0.5（双方空） |
| `heat_score(3, 3)` | 1.0 |
| `heat_score(5, 1)` | 0.0（相差 4） |
| `domain_score("文化传播类", "文化传播类", matrix)` | 1.0 |
| `domain_score("文化传播类", "思想政治教育类", matrix)` | 0.5（矩阵查表） |
| `domain_score("文化传播类", "技术分析类", matrix)` | 0.0（矩阵查表） |
| `effect_score(5)` | 1.0 |
| `effect_score(None)` | 0.6 |
| `final_score` 权重和 | = 0.45*s + 0.20*d + 0.15*h + 0.10*dom + 0.10*e（精确到 4 位小数） |

**RAG 行为验证：**

| 测试 | 预期 |
|---|---|
| 停用案例不参与检索 | toggle → `enabled=false` → retrieve 结果中不含该案例 |
| embedding_status!=ready 不参与 | 取消 embedding → retrieve 结果中不含该案例 |
| 无 ready 案例时 retrieve | 返回空 results + 非空 query_text |
| Top-K 按 final_score 降序 | results[0].final_score >= results[1].final_score >= results[2].final_score |
| Evidence Pack 的 retrieved_cases 仅含 Top-K 案例 | 数量 = top_k 或 less |
| Evidence Pack limitations 包含 "小样本" | 文本含 "小样本" 或 "课程项目" |

### 9.4 Prompt 安全回归测试

| 测试 | 方法 | 预期 |
|---|---|---|
| 报告只有三段标题 | 正则搜索 `## 一、` `## 二、` `## 三、` | 恰好 3 个匹配 |
| 无多余章节 | 搜索 "传播路径分析" "社交网络拓扑" "全网监测显示" "PSM" "DID" | 0 次出现 |
| 免责声明必含关键词 | 搜索 "辅助参考" 或 "人工复核" 或 "不构成真实决策" | ≥1 次出现 |
| 第一段引用案例 | 搜索 case 标题或 case_code | ≥1 次出现（至少引用一个案例） |
| 第二段有话术 | 搜索 "回应话术" 或 "回应" | ≥1 次出现 |
| 三段独立生成 | Mock 模式下三次 chat 调用各自独立（通过 model_name 日志验证 3 次 LLM call） | 3 次独立调用 |

### 9.5 前端组件五态测试矩阵

每个组件必须通过以下状态测试：

| 组件 | loading | error | empty | success | disabled |
|---|---|---|---|---|---|
| `CaseCard` | — | — | — | 渲染标题+Badge+分数 | 停用卡片 opacity 降低 |
| `CaseDetailDrawer` | Skeleton | error panel | "无案例数据" | 完整详情 | — |
| `CaseFormDialog` | 提交按钮 + spinner | 字段下方错误提示 | — | 表单填充 | 提交中按钮 disabled |
| `EventInputPanel` | 按钮 + spinner | toast | placeholder 文本 | 字数统计正常 | <50 字时按钮 disabled |
| `ProfileEditor` | Skeleton | error + 重试 | "尚未生成画像" | 可编辑字段 | 检索中时不可编辑 |
| `RetrievedCaseCard` | — | — | — | 分数+解释 | — |
| `SimilarityBreakdown` | — | — | "—"（无数据） | 5 条进度条 | — |
| `ReportSegmentCard` | Skeleton | "生成失败" + 重试 | "等待生成…" | Markdown 渲染 | 生成中按钮 disabled |
| `DashboardPage` | 4 Skeleton 卡片 | error panel | — | 数据展示 | — |
| `SettingsPage` | Skeleton | toast | — | 数据展示 | — |
| `EvaluationPage` | Spinner | toast | "选择测试事件" | 结果+图表 | 运行中按钮 disabled |

### 9.6 E2E 测试

**完整演示流程（Playwright）：**

1. 打开 `/` → 确认工作台加载、MetricCards 有数据
2. 打开 `/cases` → 确认案例卡片存在（28 条）
3. 点击示例输入 "高校食堂卫生问题"
4. 点击 [生成事件画像] → 等待 profile 展示
5. 修改热度等级为 4 → 点击 [检索参考案例]
6. 等待 Top-3 卡片 + SimilarityBreakdown
7. 点击 [生成三段式报告] → 等待跳转 `/reports/:id`
8. 确认 3 个段落卡片显示
9. 点击第二段 [重新生成] → 等待 loading → 内容变化
10. 点击 [导出 Markdown] → 确认文件下载

### 9.7 验收

- [ ] `pytest` 全部通过（覆盖率 ≥ 期望值）
- [ ] `pnpm test` 全部通过
- [ ] `pnpm build` 无类型错误
- [ ] `pnpm e2e` demo-flow 通过
- [ ] Mock 模式端到端可演示（无 API Key）
- [ ] `ruff check .` 通过

---

## 10. 阶段 10：演示打磨

### 10.1 任务

- [ ] 视觉检查：黑板背景、白灰画布、蓝图线稿对比度合格
- [ ] 投影可读性：字体不小于 14px、正文与背景对比度 ≥ 4.5:1
- [ ] 空状态文案补齐：每个空状态有操作引导
- [ ] Loading 动效统一：Skeleton / Spinner 风格一致、无闪烁
- [ ] Toast 文案统一：成功 "已XXX" / 失败 "XXX失败，请重试"
- [ ] 按钮 disabled 状态统一：opacity 降低 + cursor not-allowed
- [ ] `prefers-reduced-motion` 尊重：关闭背景动效
- [ ] 演示脚本准备：按 PRD §10.1 走完整 10 步
- [ ] 演示数据固定：Seed 的 3 条 demo event + 28 条案例

---

## 11. 功能优先级表

| 功能 | 优先级 | 阶段 | 状态 |
|---|---|---|---|
| 根 .gitignore + Git | P0 | 0 | ✅ |
| Schemas + API + Services | P0 | 1-2 | ✅ |
| CSV 导入 28 条案例 | P0 | 2 | ✅ |
| RAG 管线集成验证 | P0 | 3 | — |
| 前端 AppShell + 视觉 | P0 | 4 | — |
| 案例库 UI | P0 | 5 | — |
| 智能生成 UI | P0 | 6 | — |
| 报告页 UI | P0 | 7 | — |
| 设置页 | P1 | 8 | — |
| 评估页 | P1 | 8 | — |
| 工作台 | P1 | 8 | — |
| 全面测试 | P0 | 9 | — |
| 演示打磨 | P1 | 10 | — |
| docx 导出 | P1 | 后续 | — |
| LangChain adapter | P2 | 后续 | — |

---

## 12. 关键约束速查

| # | 约束 | 来源 |
|---|---|---|
| 1 | 所有 ID 为 int | PRD 复查 #3 |
| 2 | 硬删除（级联 embedding） | PRD 复查 #9 |
| 3 | 编辑案例 → embedding_status="none" | Backend §5.3 |
| 4 | Mock P0（无 Key 可全流程演示） | PRD 复查 #1 |
| 5 | 报告三段，每段独立 LLM 调用 | PRD §3.4 |
| 6 | Evidence Pack 是报告唯一依据 | PRD §6.6 |
| 7 | 报告编辑 = 重生成/复制/导出（无手动编辑） | PRD 复查 #2 |
| 8 | DomainScore 字典关系矩阵 | PRD 复查 #4 |
| 9 | event_text 50-800 chars | PRD 复查 #8 |
| 10 | `/api/settings/public` 绝不返回真实 Key | AGENT §3.5 |
| 11 | 前端不接触 API Key | AGENT §3.5 |
| 12 | `FinalScore = 0.45*Sem + 0.20*Dem + 0.15*Heat + 0.10*Dom + 0.10*Eff` | PRD §6.5.4 |
| 13 | EffectScore 缺失 → 0.6 | PRD §6.5.4 |
| 14 | Cosine 归一化 [0, 1] | Backend §6.4.2 |
| 15 | CSV 导入删除 `Unnamed:*` 列，拆分逗号字段 | Backend §6.1.1 |
| 16 | 报告不得含 "全网监测" "PSM" "DID" | PRD §6.7 |
