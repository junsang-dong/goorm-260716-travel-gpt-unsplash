import type { StoryGenerationResult, UnsplashMeta } from './types'

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
  unsplashContext?: {
    description?: string | null
    location?: string | null
    tags?: string[]
    camera?: string | null
    photographer?: string | null
  }
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
  unsplashContext?: {
    description?: string | null
    location?: string | null
    tags?: string[]
    camera?: string | null
    photographer?: string | null
  }
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

export interface UnsplashPhotoDetail extends UnsplashPhoto {
  description: string | null
  location: {
    name: string | null
    city: string | null
    country: string | null
    lat: number | null
    lng: number | null
  } | null
  tags: string[]
  exif: {
    make: string | null
    model: string | null
    aperture: string | null
    exposureTime: string | null
    focalLength: string | null
    iso: number | null
  } | null
  downloadLocation: string
}

export async function searchUnsplash(
  query: string,
  perPage = 6,
): Promise<UnsplashPhoto[]> {
  const res = await fetch('/api/unsplash', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'search', query, perPage }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Failed to search Unsplash')
  return (data.photos ?? []) as UnsplashPhoto[]
}

export async function getUnsplashPhoto(id: string): Promise<UnsplashPhotoDetail> {
  const res = await fetch('/api/unsplash', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'detail', id }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Failed to load Unsplash photo')
  return data.photo as UnsplashPhotoDetail
}

export async function trackUnsplashDownload(
  downloadLocation: string,
): Promise<void> {
  if (!downloadLocation) return
  const res = await fetch('/api/unsplash', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'track-download', downloadLocation }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    console.warn('Unsplash download track failed:', data.error ?? res.status)
  }
}

export function detailToUnsplashMeta(detail: UnsplashPhotoDetail): UnsplashMeta {
  return {
    id: detail.id,
    description: detail.description,
    location: detail.location
      ? {
          name: detail.location.name,
          city: detail.location.city,
          country: detail.location.country,
          lat: detail.location.lat,
          lng: detail.location.lng,
        }
      : null,
    tags: detail.tags,
    exif: detail.exif
      ? { make: detail.exif.make, model: detail.exif.model }
      : null,
    photographer: detail.photographer,
  }
}

export function formatUnsplashLocation(
  location: UnsplashMeta['location'] | UnsplashPhotoDetail['location'],
): string | null {
  if (!location) return null
  const place = [location.city, location.country].filter(Boolean).join(', ')
  const name = location.name?.trim()
  const coords =
    location.lat != null && location.lng != null
      ? `(${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})`
      : ''
  const base = name || place
  if (!base && !coords) return null
  return [base || place, coords].filter(Boolean).join(' ')
}

export function unsplashMetaToContext(meta: UnsplashMeta | null | undefined) {
  if (!meta) return undefined
  const camera = [meta.exif?.make, meta.exif?.model].filter(Boolean).join(' ')
  return {
    description: meta.description,
    location: formatUnsplashLocation(meta.location),
    tags: meta.tags,
    camera: camera || null,
    photographer: meta.photographer,
  }
}
