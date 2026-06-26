interface EmbeddingPreviewProps {
  embeddingText: string | null
  modelName?: string
  dimensions?: number
}

export function EmbeddingPreview({ embeddingText, modelName, dimensions }: EmbeddingPreviewProps) {
  if (!embeddingText) {
    return (
      <p className="text-sm text-[--zx-muted]">尚未生成向量</p>
    )
  }
  return (
    <div className="rounded border border-[--zx-line] bg-[--zx-panel-soft] p-3">
      <pre className="max-h-40 overflow-auto font-mono text-xs text-[--zx-muted] whitespace-pre-wrap">
        {embeddingText}
      </pre>
      {modelName && (
        <p className="mt-2 text-[10px] text-[--zx-muted]">
          model: {modelName}{dimensions != null ? ` · dims: ${dimensions}` : ""}
        </p>
      )}
    </div>
  )
}
