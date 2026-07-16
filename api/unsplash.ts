import { handleUnsplashRequest } from './lib/unsplash'

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
      UNSPLASH_ACCESS_KEY: process.env.UNSPLASH_ACCESS_KEY ?? '',
    }

    const result = await handleUnsplashRequest(
      (body ?? {}) as Parameters<typeof handleUnsplashRequest>[0],
      env,
    )
    return Response.json(result.data, { status: result.status })
  } catch (err) {
    return Response.json(
      {
        error: err instanceof Error ? err.message : 'Unsplash API failed',
      },
      { status: 500 },
    )
  }
}
