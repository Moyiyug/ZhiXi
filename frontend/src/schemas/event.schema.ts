import { z } from "zod"

export const eventInputSchema = z.object({
  event_text: z.string().min(50, "不少于 50 字").max(800, "不超过 800 字"),
})

export type EventInputData = z.infer<typeof eventInputSchema>
