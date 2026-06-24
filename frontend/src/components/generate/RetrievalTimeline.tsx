import { motion } from "motion/react"

export function RetrievalTimeline() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <svg
        className="h-32 w-64"
        viewBox="0 0 256 128"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* 扫描线 */}
        <motion.line
          x1="0" y1="64" x2="256" y2="64"
          stroke="var(--zx-blue)"
          strokeWidth="1"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: [0, 1, 1, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* 节点 */}
        {[32, 96, 160, 224].map((x, i) => (
          <motion.circle
            key={x}
            cx={x}
            cy="64"
            r="3"
            fill="var(--zx-blue)"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
            transition={{
              duration: 1.2,
              delay: i * 0.3,
              repeat: Infinity,
            }}
          />
        ))}
        {/* 网格背景 */}
        <pattern id="tl-grid" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
          <circle cx="8" cy="8" r="0.5" fill="var(--zx-line)" />
        </pattern>
        <rect width="256" height="128" fill="url(#tl-grid)" opacity="0.3" />
      </svg>
      <p className="text-sm text-[--zx-muted]">正在检索参考案例…</p>
    </div>
  )
}
