import { getApiBase } from '../config'
import { getToken } from './token'

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { json?: unknown } = {}
): Promise<T> {
  const API_BASE = getApiBase()
  const { json, ...init } = options

  const headers: HeadersInit = {
    ...(init.headers as HeadersInit),
  }

  const token = await getToken()
  if (token) {
    ;(headers as Record<string, string>).token = token
  }

  if (json !== undefined) {
    ;(headers as Record<string, string>)['Content-Type'] = 'application/json'
    init.body = JSON.stringify(json)
  }

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers })
  const contentType = res.headers.get('content-type') ?? ''

  const parseError = async () => {
    if (contentType.includes('application/json')) {
      const err = (await res.json().catch(() => ({}))) as { message?: string; error?: string }
      return err.error ?? err.message ?? res.statusText
    }
    return (await res.text().catch(() => '')) || res.statusText
  }

  if (!res.ok) throw new Error(await parseError())

  if (contentType.includes('application/json')) return res.json() as Promise<T>
  return res.text() as Promise<T>
}

