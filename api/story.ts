import { handleStoryRequest } from './lib/story'
import { adminUnauthorized, verifyAdminCode } from './lib/admin'

export const config = {
  runtime: 'edge',
}

export default async function handler(request: Request): Promise<Response> {
  try {
    if (request.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 })
    }

    let body: Record<string, unknown> = {}
    try {
      body = (await request.json()) as Record<string, unknown>
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const env = {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? '',
      OPENAI_MODEL: process.env.OPENAI_MODEL ?? 'gpt-4o',
      ADMIN_CODE: process.env.ADMIN_CODE ?? '',
    }

    const adminCode =
      request.headers.get('x-admin-code') ??
      (typeof body.adminCode === 'string' ? body.adminCode : '')

    if (!verifyAdminCode(adminCode, env)) {
      const denied = adminUnauthorized()
      return Response.json(denied.data, { status: denied.status })
    }

    const result = await handleStoryRequest(
      body as Parameters<typeof handleStoryRequest>[0],
      env,
    )
    return Response.json(result.data, { status: result.status })
  } catch (err) {
    return Response.json(
      {
        error: err instanceof Error ? err.message : 'Story API failed',
      },
      { status: 500 },
    )
  }
}
