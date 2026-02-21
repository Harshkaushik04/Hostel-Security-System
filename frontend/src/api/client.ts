/**
 * API client for Node backend (port 3000)
 */
const API_BASE = 'http://127.0.0.1:3000'

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { json?: unknown } = {}
): Promise<T> {
  const { json, ...init } = options
  const headers: HeadersInit = {
    ...(init.headers as HeadersInit),
  }
  if (json !== undefined) {
    (headers as Record<string, string>)['Content-Type'] = 'application/json'
    init.body = JSON.stringify(json)
  }
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string; error?: string }
    throw new Error(err.error ?? err.message ?? res.statusText)
  }
  const contentType = res.headers.get('content-type')
  if (contentType?.includes('application/json')) return res.json() as Promise<T>
  return res.text() as Promise<T>
}
