export function BlueprintGrid({ opacity = 0.12 }: { opacity?: number }) {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={{ opacity }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="blueprint-dots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
          <circle cx="14" cy="14" r="1" fill="var(--zx-line)" />
        </pattern>
        <pattern id="blueprint-grid" x="0" y="0" width="140" height="140" patternUnits="userSpaceOnUse">
          <rect width="140" height="140" fill="url(#blueprint-dots)" />
          <line x1="0" y1="0" x2="140" y2="0" stroke="var(--zx-line)" strokeWidth="0.5" />
          <line x1="0" y1="0" x2="0" y2="140" stroke="var(--zx-line)" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#blueprint-grid)" />
      {/* 坐标标注 */}
      <text x="16" y="20" fill="var(--zx-muted)" fontSize="8" fontFamily="var(--font-mono)">0,0</text>
      <text x="152" y="20" fill="var(--zx-muted)" fontSize="8" fontFamily="var(--font-mono)">140,0</text>
      <text x="16" y="158" fill="var(--zx-muted)" fontSize="8" fontFamily="var(--font-mono)">0,140</text>
    </svg>
  )
}
