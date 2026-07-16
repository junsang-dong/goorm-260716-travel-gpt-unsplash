import { handleStoryRequest } from './lib/story'

export const config = {
  runtime: 'edge',
}

export default async function handler(request: Request): Promise<Response> {
  try {
    if (request.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 })
    }

    let body: unknown = {}
    try {
      body = await request.json()
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const env = {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? '',
      OPENAI_MODEL: process.env.OPENAI_MODEL ?? 'gpt-4o',
    }

    const result = await handleStoryRequest(
      (body ?? {}) as Parameters<typeof handleStoryRequest>[0],
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
