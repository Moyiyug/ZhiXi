import { useEffect, useState } from "react"

interface Bird {
  id: number
  x: number
  y: number
  size: number
  opacity: number
  delay: number
  driftX: number
  driftY: number
}

/**
 * Abstract geometric bird silhouettes floating in the background.
 * Uses simple SVG paths — not replicating any specific IP or artwork.
 */
export function GlyphBirds({ count = 6, opacity = 0.08 }: { count?: number; opacity?: number }) {
  const [birds, setBirds] = useState<Bird[]>([])

  useEffect(() => {
    const generated: Bird[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 90 + 5,
      y: Math.random() * 80 + 10,
      size: Math.random() * 12 + 6,
      opacity: Math.random() * 0.6 + 0.4,
      delay: Math.random() * 3,
      driftX: (Math.random() - 0.5) * 4,
      driftY: (Math.random() - 0.5) * 3,
    }))
    setBirds(generated)
  }, [count])

  if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
    return null
  }

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={{ opacity }}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {birds.map((b) => (
        <g key={b.id} style={{ animationDelay: `${b.delay}s` }}>
          <path
            d={`M${b.x},${b.y} Q${b.x + b.size * 0.3},${b.y - b.size * 0.6} ${b.x + b.size * 0.7},${b.y - b.size * 0.2} Q${b.x + b.size * 0.5},${b.y + b.size * 0.1} ${b.x},${b.y}`}
            fill="none"
            stroke="var(--zx-line)"
            strokeWidth="0.8"
            className="animate-[bird-drift_8s_ease-in-out_infinite]"
            style={{
              opacity: b.opacity,
              transformOrigin: `${b.x}px ${b.y}px`,
            }}
          />
          <path
            d={`M${b.x + b.size * 0.7},${b.y - b.size * 0.2} Q${b.x + b.size},${b.y - b.size * 0.5} ${b.x + b.size * 1.3},${b.y - b.size * 0.1} Q${b.x + b.size * 0.9},${b.y + b.size * 0.15} ${b.x + b.size * 0.7},${b.y - b.size * 0.2}`}
            fill="none"
            stroke="var(--zx-line)"
            strokeWidth="0.8"
            className="animate-[bird-drift_8s_ease-in-out_infinite]"
            style={{
              opacity: b.opacity * 0.7,
              transformOrigin: `${b.x}px ${b.y}px`,
            }}
          />
        </g>
      ))}
    </svg>
  )
}
