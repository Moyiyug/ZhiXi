# ZhiXi_Frontend.md

> 文档版本：v0.2  
> 对应 PRD：`ZhiXi_PRD.md`  
> 目标：给 vibe coding 模型提供完整的前端设计、技术栈、模块边界、视觉风格和验收上下文。  
> 关键原则：**演示优先、风格强、信息密度高、不要复刻用户截图中的具体 IP/平台资产。**

---

## 0. Frontend Skill Reference

在使用 Cursor、Claude Code、Codex 或其他 vibe coding 工具时，可以把下面这些“技能上下文”作为前端任务拆分依据。它们不是必须安装的插件，而是给模型的角色分工提示。

### 0.1 `zhi_xi_ui_style_interpreter`

**用途**：把用户提供的参考图转换为可实现的 Web 视觉语言。  
**输入**：参考图、PRD、页面需求。  
**输出**：设计 token、布局规则、背景图案、动效原则。  
**约束**：只借鉴视觉语言，不复刻明日方舟、Bilibili 或任何具体角色/Logo/素材。

### 0.2 `zhi_xi_react_ts_architect`

**用途**：搭建 Vite + React + TypeScript 前端架构。  
**输入**：PRD 页面结构、OpenAPI 类型、组件需求。  
**输出**：路由、状态管理、API client、组件目录、表单 schema。  
**完成标准**：所有 API 有类型，禁止 `any` 横飞。

### 0.3 `zhi_xi_design_system_builder`

**用途**：基于 Tailwind + shadcn/ui 构造统一组件系统。  
**输出**：Button、Card、Panel、Badge、Dialog、Drawer、Form、ReportCanvas、CaseCard 等组件规范。  
**完成标准**：页面不直接堆 Tailwind class，复杂样式封装为组件或 utility。

### 0.4 `zhi_xi_motion_engineer`

**用途**：为检索、生成、报告段落提供克制动效。  
**输出**：页面转场、SVG 路径绘制、扫描线、进度轨、卡片浮动。  
**完成标准**：动效不影响阅读，不造成明显掉帧。

### 0.5 `zhi_xi_api_contract_guard`

**用途**：保证前端与 FastAPI 后端契约一致。  
**输出**：OpenAPI 类型生成、统一 API client、错误处理、loading 状态。  
**完成标准**：字段名来自生成类型，不手写后端返回结构。

### 0.6 `zhi_xi_demo_polisher`

**用途**：优化答辩演示流程。  
**输出**：示例输入、Mock 数据、演示脚本按钮、空状态提示。  
**完成标准**：无真实 API Key 也能展示完整流程。

---

## 1. 前端技术栈选型

### 1.1 推荐栈

```text
Vite + React + TypeScript
Tailwind CSS v4
shadcn/ui + Radix UI
TanStack Query
React Router
Zod + React Hook Form
Motion for React
Recharts 或 Tremor
lucide-react
sonner
openapi-typescript / openapi-fetch
Vitest + React Testing Library
Playwright
```

### 1.2 选型理由

| 技术 | 用途 | 选择理由 |
|---|---|---|
| Vite | 构建工具 | 官方 React TS 模板轻量，HMR 适合快速 vibe coding |
| React + TS | UI 主框架 | 类型约束能显著减少前后端字段错位 |
| Tailwind CSS | 样式系统 | 适合快速实现强视觉风格和响应式布局 |
| shadcn/ui | 组件基座 | copy-paste 组件，方便定制，不形成黑盒 |
| TanStack Query | 服务端状态 | 统一处理请求、缓存、loading、error |
| React Router | 页面路由 | 与 Tech 文档保持一致，满足当前多页演示需求 |
| Zod | 表单和运行时校验 | 与 TS 类型、表单、API payload 配合稳定 |
| Motion | 动效 | SVG 路径、透明度、位移、布局动效都适合本项目风格 |
| Recharts/Tremor | 数据可视化 | 工作台、相似度拆解、评估页可用 |
| openapi-typescript | 类型生成 | 从 FastAPI OpenAPI 自动生成前端类型 |
| Vitest | 单元测试 | 与 Vite 集成顺滑 |
| Playwright | E2E 测试 | 覆盖完整演示路径 |

### 1.3 调研参考

- Vite 官方 React TS 模板：`https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts`
- shadcn/ui Tailwind v4：`https://ui.shadcn.com/docs/tailwind-v4`
- TanStack Query TypeScript：`https://tanstack.com/query/latest/docs/framework/react/typescript`
- Motion for React：`https://motion.dev/docs/react`
- Magic UI：`https://magicui.design/`，开源动画组件库，React + TypeScript + Tailwind + Motion。
- Aceternity UI：`https://ui.aceternity.com/`，参考其背景、动效卡片、hero highlight，但不得直接复制业务无关组件。
- Tremor：`https://www.tremor.so/`，可参考 dashboard/charts 的简洁数据呈现方式。
- ShadCN Dashboard Template：`https://github.com/shadcnstore/shadcn-dashboard-landing-template`，可参考项目结构和 dashboard 基础布局。

---

## 2. 视觉风格定义

### 2.1 用户参考图风格提取

用户提供的参考图具有以下视觉特征：

1. **黑色外部舞台**：整体页面外框接近纯黑，中央内容像视频播放器或展示舞台。
2. **明亮白色画布**：核心视觉区域为高亮、低饱和白灰背景，具有强烈反差。
3. **蓝白技术线稿**：大量蓝色细线、圆形节点、坐标网格、编号、扫描式辅助线。
4. **抽象羽翼/鸟群/手部线稿意象**：轻盈、漂浮、几何化、图纸感。
5. **稀疏文字和高留白**：信息不拥挤，关键文字像字幕或标注。
6. **轻微 glitch / blur / overexposure**：边缘发光、局部模糊、图层叠加。

### 2.2 风格转译

项目中不使用原图人物、Logo、B站 UI、具体游戏资产。转译为：

```text
黑色舞台背景
+ 白灰报告画布
+ 蓝色工程线稿
+ 抽象羽翼/鸟群 SVG
+ 几何节点和标注
+ 检索过程扫描动效
+ 卡片式高密度信息
```

### 2.3 关键词

```text
noir stage / blueprint / angelic geometry / vector grid / archive card / evidence canvas / cold blue / overexposed white / research console
```

中文关键词：

```text
黑色舞台、白色档案、蓝图线稿、羽翼几何、节点标注、证据画布、冷蓝高光、克制动效
```

---

## 3. Design Tokens

### 3.1 颜色

建议使用 CSS variables，避免直接在组件中写死颜色。

```css
:root {
  --zx-bg: #030406;
  --zx-bg-soft: #07090d;
  --zx-stage: #0b0d12;
  --zx-canvas: #eef3f4;
  --zx-canvas-soft: #dfe8ea;
  --zx-ink: #111827;
  --zx-muted: #7b8794;
  --zx-line: rgba(44, 102, 176, 0.42);
  --zx-blue: #2f6fed;
  --zx-blue-soft: #85aef8;
  --zx-cyan: #b7e4ff;
  --zx-white: #f8fbff;
  --zx-danger: #e15b64;
  --zx-warning: #e8b85d;
  --zx-success: #7ccfa5;
}
```

### 3.2 颜色使用规则

| 区域 | 主色 | 说明 |
|---|---|---|
| 全局背景 | `--zx-bg` | 近黑舞台，不使用纯黑大面积死板块 |
| 内容画布 | `--zx-canvas` | 报告、输入区、案例详情 |
| 卡片暗面 | `--zx-stage` | 工作台、侧边栏、操作面板 |
| 强调色 | `--zx-blue` | 按钮、进度、active 状态 |
| 工程线 | `--zx-line` | SVG 网格、节点、装饰线 |
| 危险提示 | `--zx-danger` | 删除、失败、免责声明关键点 |

### 3.3 字体

建议：

```css
font-family: Inter, "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
```

标题可使用更窄、更技术感的字重：

```css
font-weight: 600-800;
letter-spacing: 0.02em;
```

数字和分数使用等宽字体：

```css
font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
```

### 3.4 圆角和边框

| 元素 | 圆角 | 边框 |
|---|---|---|
| 主画布 | 0-2px | 1px solid rgba(255,255,255,.08) |
| 暗色卡片 | 16px | 1px solid rgba(255,255,255,.08) |
| 浅色报告段 | 12px | 1px solid rgba(10,20,30,.08) |
| 标签 | 999px | 半透明边框 |

### 3.5 阴影与发光

不要使用传统大阴影，使用轻微蓝色外发光：

```css
box-shadow:
  0 0 0 1px rgba(255,255,255,0.05),
  0 18px 60px rgba(20, 70, 160, 0.16);
```

---

## 4. 布局架构

### 4.1 全局 AppShell

```text
<AppShell>
  <StageBackground />
  <Sidebar />
  <TopBar />
  <main>
    <Outlet />
  </main>
</AppShell>
```

### 4.2 屏幕结构

```text
┌──────────────────────────────────────────────┐
│ 黑色舞台背景                                  │
│  ┌────── Sidebar ──────┐ ┌──── TopBar ─────┐ │
│  │ ZhiXi / 导航         │ │ 状态 / Mock / API│ │
│  └─────────────────────┘ └─────────────────┘ │
│  ┌────────────────────────────────────────┐  │
│  │       中央白灰/暗色混合内容区           │  │
│  │       页面根据功能切换                  │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

### 4.3 页面最大宽度

- Dashboard：`max-w-[1440px]`
- Generate：`max-w-[1500px]`
- Report：`max-w-[1280px]`
- CaseLibrary：`max-w-[1500px]`

### 4.4 响应式

演示优先，主要适配 1440px/1920px 桌面屏。移动端只需保证不崩溃，不作为核心验收。

---

## 5. 页面设计规范

## 5.1 工作台 `/`

### 5.1.1 视觉目标

像“研究控制台”首页，展示系统状态和流程。

### 5.1.2 组件

- `HeroStage`：大标题、系统定位、主 CTA。
- `MetricCards`：案例总数、可检索案例、向量 ready、报告数。
- `PipelineBlueprint`：流程图，节点使用蓝色线稿连接。
- `RecentReports`：最近报告。
- `LimitNotice`：数据限制提示。

### 5.1.3 背景图案

使用 `BlueprintGrid` + `FloatingBirds`，透明度低于 0.18。

### 5.1.4 验收

- 能看出系统是 RAG 流程。
- 关键入口明显：案例库、智能生成。
- 不出现空洞的大图占位。

---

## 5.2 案例素材库 `/cases`

### 5.2.1 视觉目标

“档案卡片库”，避免展示太多空字段。

### 5.2.2 布局

左侧筛选栏 + 右侧卡片网格。

```text
[FilterRail] [CaseCardGrid]
```

### 5.2.3 组件

- `CaseToolbar`：新增、导入 CSV、批量向量化。
- `CaseFilterRail`：领域、状态、向量状态。
- `CaseCard`：核心字段卡片。
- `CaseDetailDrawer`：详情抽屉。
- `CaseFormDialog`：新增/编辑。
- `EmbeddingPreview`：embedding 文本预览。

### 5.2.4 CaseCard 内容

```text
案例名称
领域 Badge / 热度 Badge / 向量状态 Badge
公众诉求 Chips
策略类型 Chips
处置效果：●●●●○
启用状态 switch
```

### 5.2.5 验收

- 列表不展示 20+ 字段。
- 可完成新增、编辑、删除、停用、导入、向量化。
- 卡片空状态好看，提示导入 CSV 或新增案例。

---

## 5.3 智能生成 `/generate`

### 5.3.1 视觉目标

像“把一个事件送入分析仪”。左边输入，右边结果，中心有检索动效。

### 5.3.2 布局

```text
┌──────────────────┬────────────────────────────┐
│ EventInputPanel  │ EventProfilePanel          │
│                  ├────────────────────────────┤
│                  │ RetrievalResultPanel       │
└──────────────────┴────────────────────────────┘
```

### 5.3.3 组件

- `EventInputPanel`
- `ExamplePromptBar`
- `ProfileEditor`
- `RetrieveButton`
- `RetrievalTimeline`
- `RetrievedCaseCard`
- `SimilarityBreakdown`
- `EvidencePackDrawer`
- `GenerateReportButton`

### 5.3.4 交互状态

| 状态 | UI |
|---|---|
| 未输入 | 中央显示轻量引导和示例按钮 |
| 生成画像中 | SVG 扫描线和 loading skeleton |
| 画像生成完成 | 可编辑 chips 和 select |
| 检索中 | Top-K 区域显示线稿扫描动效 |
| 检索完成 | 展示卡片与分数 |
| 生成报告中 | 跳转到 `/reports/:id` 并显示分段生成进度 |

### 5.3.5 验收

- 事件画像必须可编辑。
- 检索结果必须可解释。
- 生成报告按钮在没有 Evidence Pack 时禁用。

---

## 5.4 报告编辑 `/reports/:id`

### 5.4.1 视觉目标

“白色证据画布 + 黑色操作边栏”。报告看起来像一份精密档案。

### 5.4.2 布局

```text
┌────────────── ReportCanvas ──────────────┬──── Inspector ────┐
│ 一、舆情画像与历史案例参考                 │ Evidence Pack      │
│ 二、处置结论与回应话术                     │ Segment Status     │
│ 三、免责声明与使用边界                     │ Actions            │
└──────────────────────────────────────────┴───────────────────┘
```

### 5.4.3 组件

- `ReportCanvas`
- `ReportSegmentCard`
- `SegmentActionBar`
- `EvidenceInspector`
- `ReportExportBar`
- `RegenerateSegmentButton`
- `MarkdownPreview`

### 5.4.4 每段卡片操作

- 重新生成本段。
- 复制本段。
- 查看依据。
- 生成状态。

注意：报告不支持手动文本编辑，所有内容由系统生成。用户可通过"重新生成本段"来调整内容。

### 5.4.5 验收

- 报告固定三段。
- 每段可单独重新生成。
- 可导出 Markdown。
- 右侧能查看 Evidence Pack。

---

## 5.5 设置页 `/settings`

### 5.5.1 内容

- Mock 模式状态。
- API Key 配置状态：只显示已配置/未配置。
- Embedding 模型名。
- LLM 模型名。
- 检索权重。
- 背景判断字典。
数据来自 `GET /api/settings/public`，不得从前端读取真实环境变量或密钥。

### 5.5.2 验收

- 不泄露真实 API Key。
- 可查看字典和权重。
- 用于答辩解释系统设计。

---

## 5.6 简单评估页 `/evaluation`

### 5.6.1 目标

用轻量方式展示模型验证意识：固定样例、Top-K 结果、人工评分入口。该页是 P1，不阻塞 P0 演示闭环。

### 5.6.2 布局

```text
[DemoEventRail] [EvaluationResultPanel]
```

### 5.6.3 组件

- `DemoEventRail`：选择 3-5 条固定测试事件。
- `RunEvaluationButton`：调用 `POST /api/evaluation/run-demo`。
- `EvaluationResultPanel`：展示 Top-K、final_score 均值、同领域命中提示。
- `ManualScoreForm`：相关性、可操作性、风险控制、表达质量四项 1-5 分。

### 5.6.4 验收

- 能运行固定测试事件。
- 能展示 Top-K 案例和参考匹配度。
- 能录入或展示人工评分入口。
- 页面明确“仅为课程原型验证”，不声称严格因果推断。

---

## 6. 组件目录规范

```text
frontend/
  src/
    app/
      App.tsx
      providers.tsx
      router.tsx
    pages/
      DashboardPage.tsx
      CaseLibraryPage.tsx
      GeneratePage.tsx
      ReportPage.tsx
      SettingsPage.tsx
      EvaluationPage.tsx
    components/
      shell/
        AppShell.tsx
        Sidebar.tsx
        TopBar.tsx
      zhi/
        BlueprintGrid.tsx
        StageBackground.tsx
        VectorLineOverlay.tsx
        GlyphBirds.tsx
        ReportCanvas.tsx
      cases/
        CaseCard.tsx
        CaseDetailDrawer.tsx
        CaseFormDialog.tsx
        EmbeddingPreview.tsx
      generate/
        EventInputPanel.tsx
        ProfileEditor.tsx
        RetrievedCaseCard.tsx
        SimilarityBreakdown.tsx
        EvidencePackDrawer.tsx
        RetrievalTimeline.tsx
      reports/
        ReportSegmentCard.tsx
        SegmentActionBar.tsx
        EvidenceInspector.tsx
        ExportReportButton.tsx
      ui/
        # shadcn/ui components
    api/
      client.ts
      generated.ts
      cases.ts
      rag.ts
      reports.ts
      settings.ts
    hooks/
      useCases.ts
      useGenerateProfile.ts
      useRetrieve.ts
      useReport.ts
    schemas/
      case.schema.ts
      event.schema.ts
    lib/
      cn.ts
      format.ts
      scores.ts
      constants.ts
    styles/
      globals.css
      tokens.css
```

---

## 7. API 调用规范

### 7.1 统一 API Client

所有请求必须通过 `src/api/client.ts`。禁止组件中直接 `fetch('/api/...')`。

```ts
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
    ...options,
  })

  if (!res.ok) {
    const message = await res.text()
    throw new Error(message || `API Error: ${res.status}`)
  }

  return res.json() as Promise<T>
}
```

### 7.2 TanStack Query 命名

```ts
queryKey: ['cases', filters]
queryKey: ['case', caseId]
queryKey: ['report', reportId]
mutationKey: ['profile-event']
mutationKey: ['retrieve-cases']
mutationKey: ['regenerate-segment', reportId, segmentKey]
```

### 7.3 错误显示

- 表单错误：字段下方显示。
- API 错误：右上角 sonner toast + 区域内 error panel。
- 模型调用失败：允许使用 Mock 重试。

---

## 8. 表单规范

### 8.1 技术

- React Hook Form。
- Zod schema。
- shadcn Form。

### 8.2 事件输入 schema 示例

```ts
import { z } from 'zod'

export const eventInputSchema = z.object({
  event_text: z.string().min(50, '请至少输入 50 个字符').max(800),
  domain: z.string().optional(),
  public_demands: z.array(z.string()).optional(),
  heat_level: z.number().min(1).max(5).optional(),
  platforms: z.array(z.string()).optional(),
})
```

### 8.3 案例表单

- 长文本使用 textarea。
- 多选使用 chips + command。
- 热度等级使用 segmented control 或 slider。
- 处置效果使用 rating dots。

---

## 9. 动效设计规范

### 9.1 动效原则

1. 只在状态变化时动，不做无意义背景循环。
2. 单个动效 120-600ms。
3. 背景漂浮元素 opacity < 0.2。
4. 尊重 `prefers-reduced-motion`。
5. 不阻挡报告文字阅读。

### 9.2 推荐动效

| 场景 | 动效 |
|---|---|
| 页面进入 | 内容区轻微 fade + y: 8 -> 0 |
| 检索中 | SVG 线条 stroke-dashoffset 扫描 |
| 向量化中 | 节点逐个点亮 |
| 卡片 hover | 边框蓝光 + y: -2 |
| 报告段生成 | skeleton shimmer + 打字机不推荐，使用渐显 |
| Evidence Drawer | 从右侧滑入 |

### 9.3 Motion 示例

```tsx
import { motion } from 'motion/react'

export function FadeInPanel({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
```

### 9.4 SVG 路径扫描示例

```tsx
export function VectorLineOverlay() {
  return (
    <svg className="pointer-events-none absolute inset-0 opacity-30" viewBox="0 0 1000 600">
      <motion.path
        d="M80 420 C260 160 520 500 900 120"
        fill="none"
        stroke="var(--zx-line)"
        strokeWidth="1"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.4, ease: 'easeInOut' }}
      />
    </svg>
  )
}
```

---

## 10. 图案设计思路

### 10.1 禁止事项

- 不使用用户截图中的人物、手、鸟、Logo 原图。
- 不使用“明日方舟”“Bilibili”等品牌标识。
- 不做可识别角色复刻。

### 10.2 可实现元素

1. **抽象鸟群**：用简单 SVG path 或 CSS clip-path 绘制几何鸟形。
2. **蓝图网格**：点阵 + 圆形辅助线 + 编号。
3. **节点连线**：根据检索流程连接输入、embedding、案例、报告。
4. **羽翼切片**：多段半透明 polygon，形成翼状但非具象图案。
5. **字幕式提示**：小号白字或蓝字漂浮在内容区边缘。

### 10.3 背景组件建议

```text
StageBackground
  - 黑色径向渐变
  - 边缘暗角
  - 低透明度噪声纹理

BlueprintGrid
  - 点阵
  - 蓝色细线
  - 坐标十字

GlyphBirds
  - 抽象鸟群 SVG
  - 不循环大幅位移，只轻微漂浮

ReportCanvasTexture
  - 白灰渐变
  - 极淡网格
  - 纸张/档案感
```

---

## 11. 样式落地示例

### 11.1 StageBackground

```tsx
export function StageBackground() {
  return (
    <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(47,111,237,0.16),transparent_38%),#030406]">
      <div className="absolute inset-0 opacity-[0.06] [background-image:radial-gradient(circle,white_1px,transparent_1px)] [background-size:28px_28px]" />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/5 to-transparent" />
    </div>
  )
}
```

### 11.2 ReportCanvas

```tsx
export function ReportCanvas({ children }: { children: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden rounded-sm border border-white/10 bg-[#eef3f4] text-zinc-950 shadow-[0_0_0_1px_rgba(255,255,255,.06),0_30px_100px_rgba(47,111,237,.16)]">
      <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle,rgba(47,111,237,.35)_1px,transparent_1px)] [background-size:36px_36px]" />
      <div className="relative p-8 md:p-10">{children}</div>
    </section>
  )
}
```

---

## 12. 页面状态规范

每个主页面必须有：

- Loading state。
- Empty state。
- Error state。
- Success state。

示例：案例库为空时：

```text
暂无可用案例素材
导入 CSV 或新增案例后，系统将自动构造 embedding 文本并参与检索。
[导入 CSV] [新增案例]
```

---

## 13. Accessibility 与可读性

- 所有按钮有明确文本，不只用图标。
- 蓝色发光不可作为唯一状态区分，必须有文字或图标。
- 报告正文对比度优先。
- 动效需要支持 reduced motion。
- 表单错误必须可读。

---

## 14. 前端验收清单

### 14.1 功能验收

- [ ] 路由完整。
- [ ] 案例库 CRUD 可用。
- [ ] CSV 导入入口可用。
- [ ] 事件画像生成可用。
- [ ] 画像可编辑。
- [ ] 检索结果可展示相似度拆解。
- [ ] Evidence Pack 可查看。
- [ ] 三段式报告可展示。
- [ ] 每段可局部重生成。
- [ ] Markdown 可导出。
- [ ] Mock 模式可演示。

### 14.2 风格验收

- [ ] 黑色舞台背景。
- [ ] 白灰报告画布。
- [ ] 蓝色工程线稿。
- [ ] 几何节点/网格/标注。
- [ ] 不使用原图素材或品牌 Logo。
- [ ] 内容可读，不被风格覆盖。

### 14.3 代码验收

- [ ] 无裸 `fetch`。
- [ ] 无真实 API Key。
- [ ] 无大面积 `any`。
- [ ] 复杂 UI 拆成组件。
- [ ] hooks 不直接写在页面中超过合理长度。
- [ ] `pnpm lint`、`pnpm test` 通过。

---

## 15. 给 vibe coding 模型的前端实现提示

当要求模型实现前端时，建议这样提示：

```text
请先阅读 `docs/ZhiXi_Context_Docs/ZhiXi_PRD.md` 和 `docs/ZhiXi_Context_Docs/ZhiXi_Frontend.md`。
你正在实现一个演示优先的 RAG 舆情策略生成系统前端。
技术栈必须使用 Vite + React + TypeScript + Tailwind + shadcn/ui + TanStack Query。
请不要复制用户参考图中的任何具体 IP 或 Logo，只转译为黑色舞台、白灰画布、蓝图线稿、几何节点风格。
实现时优先保证 /cases、/generate、/reports/:id 三个 P0 页面。
所有 API 请求必须通过 src/api/client.ts，并优先使用 OpenAPI 生成类型。
```
