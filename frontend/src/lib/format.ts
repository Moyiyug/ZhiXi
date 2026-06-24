export function formatPercent(n: number): string {
  return `${Math.round(n * 100)}%`
}

export function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatScoreLabel(n: number): string {
  if (n >= 0.8) return "高"
  if (n >= 0.5) return "中"
  return "低"
}

export function formatHeatLevel(level: number): string {
  const labels: Record<number, string> = {
    1: "1 级 — 可控",
    2: "2 级 — 低位关注",
    3: "3 级 — 中热度",
    4: "4 级 — 高热度",
    5: "5 级 — 高热/爆",
  }
  return labels[level] ?? `${level} 级`
}
