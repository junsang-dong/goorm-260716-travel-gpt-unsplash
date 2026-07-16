export interface UnsplashRequestBody {
  action?: 'search' | 'detail' | 'track-download'
  query?: string
  perPage?: number
  id?: string
  downloadLocation?: string
}

export interface UnsplashPhotoResult {
  id: string
  url: string
  thumb: string
  alt: string
  photographer: string
  photographerUrl: string
}

export interface UnsplashLocation {
  name: string | null
  city: string | null
  country: string | null
  lat: number | null
  lng: number | null
}

export interface UnsplashExif {
  make: string | null
  model: string | null
  aperture: string | null
  exposureTime: string | null
  focalLength: string | null
  iso: number | null
}

export interface UnsplashPhotoDetail extends UnsplashPhotoResult {
  description: string | null
  location: UnsplashLocation | null
  tags: string[]
  exif: UnsplashExif | null
  downloadLocation: string
}

function authHeaders(accessKey: string) {
  return {
    Authorization: `Client-ID ${accessKey}`,
    'Accept-Version': 'v1',
  }
}

async function searchPhotos(
  body: UnsplashRequestBody,
  accessKey: string,
): Promise<{ status: number; data: unknown }> {
  const query = (body.query ?? 'travel photography').trim() || 'travel photography'
  const perPage = Math.min(Math.max(body.perPage ?? 6, 1), 12)

  const url = new URL('https://api.unsplash.com/search/photos')
  url.searchParams.set('query', query)
  url.searchParams.set('per_page', String(perPage))
  url.searchParams.set('orientation', 'landscape')

  const res = await fetch(url.toString(), { headers: authHeaders(accessKey) })
  if (!res.ok) {
    const text = await res.text()
    return { status: res.status, data: { error: `Unsplash error: ${text}` } }
  }

  const json = (await res.json()) as {
    results?: Array<{
      id: string
      alt_description: string | null
      description: string | null
      urls: { regular: string; small: string }
      user: { name: string; links: { html: string } }
    }>
  }

  const photos: UnsplashPhotoResult[] = (json.results ?? []).map((p) => ({
    id: p.id,
    url: p.urls.regular,
    thumb: p.urls.small,
    alt: p.alt_description || p.description || query,
    photographer: p.user.name,
    photographerUrl: p.user.links.html,
  }))

  return { status: 200, data: { photos, query } }
}

async function getPhotoDetail(
  id: string,
  accessKey: string,
): Promise<{ status: number; data: unknown }> {
  const res = await fetch(`https://api.unsplash.com/photos/${encodeURIComponent(id)}`, {
    headers: authHeaders(accessKey),
  })
  if (!res.ok) {
    const text = await res.text()
    return { status: res.status, data: { error: `Unsplash error: ${text}` } }
  }

  const p = (await res.json()) as {
    id: string
    alt_description: string | null
    description: string | null
    urls: { regular: string; small: string }
    user: { name: string; links: { html: string } }
    location?: {
      name?: string | null
      city?: string | null
      country?: string | null
      position?: { latitude?: number | null; longitude?: number | null }
    } | null
    tags?: Array<{ title: string }>
    exif?: {
      make?: string | null
      model?: string | null
      aperture?: string | null
      exposure_time?: string | null
      focal_length?: string | null
      iso?: number | null
    } | null
    links?: { download_location?: string }
  }

  const loc = p.location
  const hasLocation =
    loc &&
    (loc.name ||
      loc.city ||
      loc.country ||
      loc.position?.latitude != null ||
      loc.position?.longitude != null)

  const exifRaw = p.exif
  const hasExif =
    exifRaw &&
    (exifRaw.make ||
      exifRaw.model ||
      exifRaw.aperture ||
      exifRaw.exposure_time ||
      exifRaw.focal_length ||
      exifRaw.iso != null)

  const detail: UnsplashPhotoDetail = {
    id: p.id,
    url: p.urls.regular,
    thumb: p.urls.small,
    alt: p.alt_description || p.description || 'Unsplash photo',
    description: p.description || p.alt_description || null,
    photographer: p.user.name,
    photographerUrl: p.user.links.html,
    location: hasLocation
      ? {
          name: loc?.name ?? null,
          city: loc?.city ?? null,
          country: loc?.country ?? null,
          lat: loc?.position?.latitude ?? null,
          lng: loc?.position?.longitude ?? null,
        }
      : null,
    tags: (p.tags ?? []).map((t) => t.title).filter(Boolean),
    exif: hasExif
      ? {
          make: exifRaw?.make ?? null,
          model: exifRaw?.model ?? null,
          aperture: exifRaw?.aperture ?? null,
          exposureTime: exifRaw?.exposure_time ?? null,
          focalLength: exifRaw?.focal_length ?? null,
          iso: exifRaw?.iso ?? null,
        }
      : null,
    downloadLocation: p.links?.download_location ?? '',
  }

  return { status: 200, data: { photo: detail } }
}

async function trackDownload(
  downloadLocation: string,
  accessKey: string,
): Promise<{ status: number; data: unknown }> {
  if (!downloadLocation) {
    return { status: 400, data: { error: 'downloadLocation is required' } }
  }

  const url = new URL(downloadLocation)
  // Ensure client_id is present for tracking endpoint
  if (!url.searchParams.has('client_id')) {
    url.searchParams.set('client_id', accessKey)
  }

  const res = await fetch(url.toString(), { headers: authHeaders(accessKey) })
  if (!res.ok) {
    const text = await res.text()
    return { status: res.status, data: { error: `Unsplash download track error: ${text}` } }
  }

  const json = (await res.json()) as { url?: string }
  return { status: 200, data: { tracked: true, url: json.url ?? null } }
}

export async function handleUnsplashRequest(
  body: UnsplashRequestBody,
  env: Record<string, string>,
): Promise<{ status: number; data: unknown }> {
  try {
    const accessKey = env.UNSPLASH_ACCESS_KEY
    if (!accessKey) {
      return {
        status: 500,
        data: { error: 'UNSPLASH_ACCESS_KEY is not configured' },
      }
    }

    const action = body.action ?? 'search'

    if (action === 'detail') {
      if (!body.id?.trim()) {
        return { status: 400, data: { error: 'id is required for detail' } }
      }
      return getPhotoDetail(body.id.trim(), accessKey)
    }

    if (action === 'track-download') {
      return trackDownload(body.downloadLocation ?? '', accessKey)
    }

    return searchPhotos(body, accessKey)
  } catch (err) {
    return {
      status: 500,
      data: {
        error: err instanceof Error ? err.message : 'Unsplash request failed',
      },
    }
  }
}
