import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleUnsplashRequest } from '../server/unsplash'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const env = {
    UNSPLASH_ACCESS_KEY: process.env.UNSPLASH_ACCESS_KEY ?? '',
  }

  const result = await handleUnsplashRequest(req.body ?? {}, env)
  return res.status(result.status).json(result.data)
}
