export const apiBaseUrl = ((import.meta.env.VITE_API_BASE_URL as string | undefined) || 'http://localhost:4000').replace(/\/$/, '')

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, { credentials: 'include', ...options, headers: { 'Content-Type': 'application/json', ...options.headers } })
  const payload = await response.json().catch(() => ({})) as { data?: T; error?: { message?: string; code?: string } }
  if (!response.ok) { const error = new Error(payload.error?.message || `Request failed (${response.status})`); Object.assign(error, { status: response.status, code: payload.error?.code }); throw error }
  return payload.data as T
}
