export function StageBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      {/* 黑色径向渐变 */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(47,111,237,0.16),transparent_38%),#030406]" />
      {/* 点阵噪声 */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      {/* 顶部光晕 */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/5 to-transparent" />
    </div>
  )
}
