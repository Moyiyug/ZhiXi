import { z } from "zod"

export const caseSchema = z.object({
  title: z.string().min(1, "案例名称必填"),
  domain: z.enum([
    "文化传播类",
    "思想政治教育类",
    "政府管理类",
    "技术分析类",
    "其他",
  ], { message: "请选择所属领域" }),
  public_demands: z.array(z.string()).min(1, "至少选一个公众诉求"),
  heat_level: z.number().min(1).max(5, "热度等级 1-5"),
  effect_score: z.number().min(1).max(5).nullable().optional(),
  strategy_types: z.array(z.string()).min(1, "至少选一个策略类型"),
  event_description: z.string().min(50, "事件描述至少 50 字").max(300, "不超过 300 字"),
  strategy_text: z.string().min(30, "策略描述至少 30 字").max(200, "不超过 200 字"),
  response_speed: z.string().nullable().optional(),
  vertical_subject: z.string().nullable().optional(),
  carrier_target: z.string().nullable().optional(),
  trigger_reason: z.string().nullable().optional(),
  risk_tags: z.array(z.string()).optional(),
  notes: z.string().nullable().optional(),
  case_code: z.string().nullable().optional(),
})

export type CaseFormData = z.infer<typeof caseSchema>
