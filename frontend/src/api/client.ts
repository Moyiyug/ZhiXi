const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = new Headers(options?.headers)
  if (options?.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    const contentType = res.headers.get("content-type") ?? ""
    const message = contentType.includes("application/json")
      ? JSON.stringify(await res.json())
      : await res.text()
    throw new Error(message || `API Error: ${res.status}`)
  }

  if (res.status === 204) {
    return undefined as T
  }

  const contentType = res.headers.get("content-type") ?? ""
  if (contentType.includes("application/json")) {
    return res.json() as Promise<T>
  }

  return res.text() as Promise<T>
}
