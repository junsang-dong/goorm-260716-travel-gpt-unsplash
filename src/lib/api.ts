import type { StoryGenerationResult } from './types'

export async function generateStory(payload: {
  tripTitle: string
  country: string
  city: string
  day: number
  date?: string | null
  locations?: string[]
  photoMeta?: Array<{
    date?: string | null
    latitude?: number | null
    longitude?: number | null
    camera?: string | null
    caption?: string | null
  }>
  userMemo?: string
}): Promise<StoryGenerationResult> {
  const res = await fetch('/api/story', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'story', ...payload }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Failed to generate story')
  return data as StoryGenerationResult
}

export async function generateCaption(payload: {
  imageDescription: string
  city?: string
  country?: string
}): Promise<string> {
  const res = await fetch('/api/story', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'caption', ...payload }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Failed to generate caption')
  return data.caption as string
}

export interface UnsplashPhoto {
  id: string
  url: string
  thumb: string
  alt: string
  photographer: string
  photographerUrl: string
}

export async function searchUnsplash(
  query: string,
  perPage = 6,
): Promise<UnsplashPhoto[]> {
  const res = await fetch('/api/unsplash', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, perPage }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Failed to search Unsplash')
  return (data.photos ?? []) as UnsplashPhoto[]
}
