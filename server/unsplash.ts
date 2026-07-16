export interface UnsplashRequestBody {
  query?: string
  perPage?: number
}

export interface UnsplashPhotoResult {
  id: string
  url: string
  thumb: string
  alt: string
  photographer: string
  photographerUrl: string
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

    const query = (body.query ?? 'travel photography').trim() || 'travel photography'
    const perPage = Math.min(Math.max(body.perPage ?? 6, 1), 12)

    const url = new URL('https://api.unsplash.com/search/photos')
    url.searchParams.set('query', query)
    url.searchParams.set('per_page', String(perPage))
    url.searchParams.set('orientation', 'landscape')

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
        'Accept-Version': 'v1',
      },
    })

    if (!res.ok) {
      const text = await res.text()
      return {
        status: res.status,
        data: { error: `Unsplash error: ${text}` },
      }
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
  } catch (err) {
    return {
      status: 500,
      data: {
        error: err instanceof Error ? err.message : 'Unsplash search failed',
      },
    }
  }
}
