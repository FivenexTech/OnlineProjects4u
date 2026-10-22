export const apiBaseUrl = ((import.meta.env.VITE_API_BASE_URL as string | undefined) || 'http://localhost:4000').replace(/\/$/, '')

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 8000)
  let response: Response
  try {
    response = await fetch(`${apiBaseUrl}${path}`, { credentials: 'include', ...options, signal: options.signal || controller.signal, headers: { 'Content-Type': 'application/json', ...options.headers } })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw new Error('The backend request timed out or was cancelled.')
    throw new Error('The backend is unavailable. Check that the API is running and try again.')
  } finally {
    window.clearTimeout(timeout)
  }
  const payload = await response.json().catch(() => ({})) as { data?: T; error?: { message?: string; code?: string } }
  if (!response.ok) { const error = new Error(payload.error?.message || `Request failed (${response.status})`); Object.assign(error, { status: response.status, code: payload.error?.code }); throw error }
  return payload.data as T
}
