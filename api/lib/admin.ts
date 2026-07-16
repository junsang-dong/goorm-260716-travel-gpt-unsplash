export function getExpectedAdminCode(env: Record<string, string>): string {
  return (env.ADMIN_CODE ?? '').trim()
}

export function verifyAdminCode(
  provided: string | null | undefined,
  env: Record<string, string>,
): boolean {
  const expected = getExpectedAdminCode(env)
  if (!expected) return false
  return (provided ?? '').trim() === expected
}

export function adminUnauthorized() {
  return {
    status: 401,
    data: { error: '관리자 코드가 필요합니다. 글쓰기 권한을 먼저 인증해 주세요.' },
  }
}
