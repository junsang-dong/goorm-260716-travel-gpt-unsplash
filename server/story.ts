export type Mood =
  | 'Calm'
  | 'Adventure'
  | 'Romantic'
  | 'Hiking'
  | 'City'
  | 'Luxury'
  | 'Backpacking'

export interface StoryGenerationResult {
  title: string
  content: string
  mood: Mood | string
  snsSummary: string
  hashtags: string[]
  unsplashKeywords: string
}

export interface StoryRequestBody {
  action?: 'story' | 'caption'
  tripTitle?: string
  country?: string
  city?: string
  day?: number
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
  imageDescription?: string
  unsplashContext?: {
    description?: string | null
    location?: string | null
    tags?: string[]
    camera?: string | null
    photographer?: string | null
  }
}

function getModel(env: Record<string, string>) {
  return env.OPENAI_MODEL || 'gpt-4o'
}

async function chatJson(
  env: Record<string, string>,
  system: string,
  user: string,
): Promise<unknown> {
  const apiKey = env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured')
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: getModel(env),
      temperature: 0.8,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`OpenAI error ${res.status}: ${text}`)
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('Empty OpenAI response')
  return JSON.parse(content)
}

const MOODS: Mood[] = [
  'Calm',
  'Adventure',
  'Romantic',
  'Hiking',
  'City',
  'Luxury',
  'Backpacking',
]

export async function handleStoryRequest(
  body: StoryRequestBody,
  env: Record<string, string>,
): Promise<{ status: number; data: unknown }> {
  try {
    const action = body.action ?? 'story'

    if (action === 'caption') {
      const ctx = body.unsplashContext
      const extra = [
        ctx?.description,
        ctx?.location ? `Location: ${ctx.location}` : null,
        ctx?.tags?.length ? `Tags: ${ctx.tags.join(', ')}` : null,
      ]
        .filter(Boolean)
        .join('\n')

      const result = (await chatJson(
        env,
        'You write poetic one-line photo captions for travel journals. Reply JSON only: {"caption":"..."}',
        `Write one Korean caption for this travel photo.\nDescription/meta: ${body.imageDescription ?? 'travel photo'}\nLocation: ${body.city ?? ''} ${body.country ?? ''}\n${extra}`,
      )) as { caption?: string }

      return {
        status: 200,
        data: { caption: result.caption ?? '여행의 한 순간.' },
      }
    }

    const system = `You are an AI travel story writer. Write lyrical Korean travel journal prose.
Use the Unsplash reference photo context (location, tags, description) when provided to enrich atmosphere and concrete details.
Reply with JSON only:
{
  "title": string,
  "content": string (3-6 short paragraphs, Korean),
  "mood": one of ${MOODS.join(', ')},
  "snsSummary": string (1-2 sentences Korean),
  "hashtags": string[] (3-8 tags without #),
  "unsplashKeywords": string (English keywords for travel photography search)
}`

    const ctx = body.unsplashContext
    const unsplashBlock = ctx
      ? [
          'Unsplash reference photo:',
          `- Description: ${ctx.description ?? 'n/a'}`,
          `- Location: ${ctx.location ?? 'n/a'}`,
          `- Tags: ${(ctx.tags ?? []).join(', ') || 'n/a'}`,
          `- Camera: ${ctx.camera ?? 'n/a'}`,
          `- Photographer: ${ctx.photographer ?? 'n/a'}`,
        ].join('\n')
      : 'Unsplash reference photo: none'

    const user = [
      `Trip: ${body.tripTitle ?? 'Untitled'}`,
      `Place: ${body.city ?? ''}, ${body.country ?? ''}`,
      `Day: ${body.day ?? 1}`,
      `Date: ${body.date ?? 'unknown'}`,
      `Locations: ${(body.locations ?? []).join(', ') || 'unknown'}`,
      `Photo metadata: ${JSON.stringify(body.photoMeta ?? [])}`,
      `User memo: ${body.userMemo ?? ''}`,
      unsplashBlock,
    ].join('\n')

    const raw = (await chatJson(env, system, user)) as Partial<StoryGenerationResult>
    const data: StoryGenerationResult = {
      title: raw.title ?? `${body.city || '여행'}의 ${body.day ?? 1}일차`,
      content:
        raw.content ??
        '조용한 아침이 여행을 열어 주었다. 낯선 골목과 따뜻한 빛이 하루를 기억하게 만든다.',
      mood: MOODS.includes(raw.mood as Mood) ? (raw.mood as Mood) : 'Calm',
      snsSummary: raw.snsSummary ?? '여행의 하루를 기록합니다.',
      hashtags: Array.isArray(raw.hashtags) ? raw.hashtags : ['travel', 'journal'],
      unsplashKeywords:
        raw.unsplashKeywords ??
        `${body.city ?? 'travel'} ${body.country ?? ''} travel photography`,
    }

    return { status: 200, data }
  } catch (err) {
    return {
      status: 500,
      data: { error: err instanceof Error ? err.message : 'Story generation failed' },
    }
  }
}
