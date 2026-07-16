const STORAGE_KEY = 'ats_admin_code'

export function getStoredAdminCode(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function setStoredAdminCode(code: string) {
  sessionStorage.setItem(STORAGE_KEY, code)
}

export function clearStoredAdminCode() {
  sessionStorage.removeItem(STORAGE_KEY)
}

export function isAdminUnlocked(): boolean {
  return Boolean(getStoredAdminCode())
}

export function adminHeaders(): HeadersInit {
  const code = getStoredAdminCode()
  return code ? { 'X-Admin-Code': code } : {}
}

export async function verifyAdminCode(code: string): Promise<void> {
  const res = await fetch('/api/admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  })
  const text = await res.text()
  let data: { ok?: boolean; error?: string } = {}
  try {
    data = JSON.parse(text) as { ok?: boolean; error?: string }
  } catch {
    throw new Error(`API returned non-JSON (${res.status}): ${text.slice(0, 80)}`)
  }
  if (!res.ok || !data.ok) {
    throw new Error(data.error ?? '관리자 인증에 실패했습니다.')
  }
  setStoredAdminCode(code.trim())
}
