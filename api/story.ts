import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleStoryRequest } from '../server/story'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const env = {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? '',
    OPENAI_MODEL: process.env.OPENAI_MODEL ?? 'gpt-4o',
  }

  const result = await handleStoryRequest(req.body ?? {}, env)
  return res.status(result.status).json(result.data)
}
