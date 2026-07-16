import { verifyAdminCode } from './lib/admin.js'
import { readEnv } from './lib/env.js'

export const config = {
  runtime: 'edge',
}

export default async function handler(request: Request): Promise<Response> {
  try {
    if (request.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 })
    }

    let body: { code?: string } = {}
    try {
      body = (await request.json()) as { code?: string }
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const env = {
      ADMIN_CODE: readEnv('ADMIN_CODE'),
    }

    if (!env.ADMIN_CODE) {
      return Response.json(
        { error: 'ADMIN_CODE is not configured on the server' },
        { status: 500 },
      )
    }

    if (!verifyAdminCode(body.code, env)) {
      return Response.json(
        { ok: false, error: '관리자 코드가 올바르지 않습니다.' },
        { status: 401 },
      )
    }

    return Response.json({ ok: true })
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Admin verify failed' },
      { status: 500 },
    )
  }
}
