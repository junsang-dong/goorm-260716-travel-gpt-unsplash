import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  getStoryByDay,
  getTrip,
  listPhotos,
  updatePhoto,
  updateTrip,
  upsertStory,
} from '@/lib/db'
import { tripDayNumber } from '@/lib/exif'
import {
  detailToUnsplashMeta,
  generateCaption,
  generateStory,
  unsplashMetaToContext,
  type UnsplashPhotoDetail,
} from '@/lib/api'
import type { Photo, Story, Trip, UnsplashMeta } from '@/lib/types'
import { useObjectUrl } from '@/lib/hooks'
import { PhotoGrid } from '@/components/PhotoGrid'
import { UnsplashPicker } from '@/components/UnsplashPicker'
import { useAdminGate } from '@/hooks/useAdminGate'

export function StoryEditorPage() {
  const { tripId, day: dayParam } = useParams<{ tripId: string; day: string }>()
  const day = Math.max(1, Number(dayParam) || 1)

  const [trip, setTrip] = useState<Trip | null>(null)
  const [story, setStory] = useState<Story | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [mood, setMood] = useState('Calm')
  const [snsSummary, setSnsSummary] = useState('')
  const [hashtags, setHashtags] = useState<string[]>([])
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null)
  const [unsplashMeta, setUnsplashMeta] = useState<UnsplashMeta | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerQuery, setPickerQuery] = useState('')
  const [memo, setMemo] = useState('')
  const [busy, setBusy] = useState(false)
  const [captionBusy, setCaptionBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { isAdmin, runOrAskAdmin, gateModal } = useAdminGate()

  const load = useCallback(async () => {
    if (!tripId) return
    const [t, s, p] = await Promise.all([
      getTrip(tripId),
      getStoryByDay(tripId, day),
      listPhotos(tripId),
    ])
    setTrip(t ?? null)
    setStory(s ?? null)
    setPhotos(p)
    if (s) {
      setTitle(s.title)
      setContent(s.content)
      setMood(s.mood)
      setSnsSummary(s.snsSummary ?? '')
      setHashtags(s.hashtags ?? [])
      setHeroImageUrl(s.heroImageUrl)
      setUnsplashMeta(s.unsplashMeta ?? null)
    } else {
      setTitle('')
      setContent('')
      setMood('Calm')
      setSnsSummary('')
      setHashtags([])
      setHeroImageUrl(null)
      setUnsplashMeta(t?.unsplashMeta ?? null)
      if (t?.coverImageUrl && !s) {
        setHeroImageUrl(t.coverImageUrl)
      }
    }
  }, [tripId, day])

  useEffect(() => {
    void load()
  }, [load])

  const dayPhotos = useMemo(() => {
    if (!trip) return photos
    return photos.filter(
      (p) => tripDayNumber(p.date, trip.startDate || trip.createdAt) === day,
    )
  }, [photos, trip, day])

  const heroPreview = useObjectUrl(
    dayPhotos[0]?.blob ?? null,
  )

  async function handleGenerate() {
    if (!trip || !tripId) return
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      const result = await generateStory({
        tripTitle: trip.title,
        country: trip.country,
        city: trip.city,
        day,
        date: dayPhotos[0]?.date ?? trip.startDate,
        locations: [trip.city, trip.country].filter(Boolean),
        photoMeta: dayPhotos.map((p) => ({
          date: p.date,
          latitude: p.latitude,
          longitude: p.longitude,
          camera: p.camera,
          caption: p.aiCaption,
        })),
        userMemo: memo,
        unsplashContext: unsplashMetaToContext(
          unsplashMeta ?? trip.unsplashMeta,
        ),
      })

      setTitle(result.title)
      setContent(result.content)
      setMood(result.mood)
      setSnsSummary(result.snsSummary)
      setHashtags(result.hashtags)

      const saved = await upsertStory({
        id: story?.id,
        tripId,
        day,
        title: result.title,
        content: result.content,
        mood: result.mood,
        heroImageUrl,
        snsSummary: result.snsSummary,
        hashtags: result.hashtags,
        unsplashMeta: unsplashMeta ?? trip.unsplashMeta ?? null,
      })
      setStory(saved)

      if (!trip.summary && result.snsSummary) {
        await updateTrip(tripId, { summary: result.snsSummary })
      }

      if (!heroImageUrl && result.unsplashKeywords) {
        setPickerQuery(result.unsplashKeywords)
        setPickerOpen(true)
        setMessage(
          'AI 여행기가 저장되었습니다. Unsplash에서 Hero 사진을 골라 주세요.',
        )
      } else {
        setMessage('AI 여행기가 생성되어 저장되었습니다.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '생성 실패')
    } finally {
      setBusy(false)
    }
  }

  async function handleSave() {
    if (!tripId) return
    setBusy(true)
    setError(null)
    try {
      const saved = await upsertStory({
        id: story?.id,
        tripId,
        day,
        title: title || `Day ${day}`,
        content,
        mood,
        heroImageUrl,
        snsSummary,
        hashtags,
        unsplashMeta,
      })
      setStory(saved)
      setMessage('저장되었습니다.')
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장 실패')
    } finally {
      setBusy(false)
    }
  }

  async function applyHero(detail: UnsplashPhotoDetail) {
    if (!tripId) return
    const meta = detailToUnsplashMeta(detail)
    setHeroImageUrl(detail.url)
    setUnsplashMeta(meta)
    const saved = await upsertStory({
      id: story?.id,
      tripId,
      day,
      title: title || `Day ${day}`,
      content,
      mood,
      heroImageUrl: detail.url,
      snsSummary,
      hashtags,
      unsplashMeta: meta,
    })
    setStory(saved)
    if (trip && !trip.coverImageUrl) {
      await updateTrip(tripId, {
        coverImageUrl: detail.url,
        unsplashMeta: meta,
      })
    }
    setMessage('Unsplash Hero가 적용되었습니다.')
  }

  async function handleCaptions() {
    if (!trip || dayPhotos.length === 0) return
    setCaptionBusy(true)
    setError(null)
    try {
      const ctx = unsplashMetaToContext(unsplashMeta ?? trip.unsplashMeta)
      for (const photo of dayPhotos) {
        const caption = await generateCaption({
          imageDescription: [
            photo.camera,
            photo.date,
            photo.latitude != null
              ? `GPS ${photo.latitude},${photo.longitude}`
              : null,
            trip.city,
            trip.country,
          ]
            .filter(Boolean)
            .join(' · '),
          city: trip.city,
          country: trip.country,
          unsplashContext: ctx,
        })
        await updatePhoto(photo.id, { aiCaption: caption })
      }
      await load()
      setMessage('사진 캡션을 생성했습니다.')
    } catch (err) {
      setError(err instanceof Error ? err.message : '캡션 생성 실패')
    } finally {
      setCaptionBusy(false)
    }
  }

  if (!trip) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-20 text-center text-ink-muted">
        불러오는 중…
      </div>
    )
  }

  const displayHero = heroImageUrl || heroPreview

  return (
    <article>
      <section className="relative min-h-[55dvh] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: displayHero
              ? `linear-gradient(180deg, rgba(22,57,68,.2), rgba(22,57,68,.78)), url(${displayHero})`
              : 'linear-gradient(135deg, #163944, #4d6f7a)',
          }}
        />
        <div className="relative mx-auto flex min-h-[55dvh] max-w-3xl flex-col justify-end px-5 pb-12 pt-16">
          <Link
            to={`/trips/${tripId}`}
            className="mb-6 text-sm text-paper/80 hover:text-paper"
          >
            ← {trip.title}
          </Link>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-mist">
            Day {day}
          </p>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 font-display text-4xl font-semibold text-paper sm:text-5xl"
          >
            {title || '오늘의 여행기를 작성합니다'}
          </motion.h1>
          {mood ? (
            <span className="mt-4 inline-flex w-fit rounded-full bg-paper/90 px-3 py-1 text-xs font-medium text-sea-deep">
              {mood}
            </span>
          ) : null}
        </div>
      </section>

      <div className="mx-auto max-w-3xl space-y-8 px-5 py-10">
        <label className="block text-sm">
          <span className="mb-1 block text-ink-muted">메모 (선택)</span>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            rows={2}
            placeholder="오늘 느낀 점, 특별한 순간…"
            className="w-full rounded-xl border border-sand bg-paper px-3 py-2 outline-none ring-sea focus:ring-2"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => runOrAskAdmin(() => void handleGenerate())}
            disabled={busy}
            className="rounded-full bg-coral px-5 py-2.5 text-sm font-semibold text-paper disabled:opacity-60"
          >
            {busy ? 'AI 작성 중…' : 'AI로 여행기 생성'}
          </button>
          <button
            type="button"
            onClick={() => runOrAskAdmin(() => void handleSave())}
            disabled={busy}
            className="rounded-full bg-sea px-5 py-2.5 text-sm font-medium text-paper disabled:opacity-60"
          >
            저장
          </button>
          <button
            type="button"
            onClick={() =>
              runOrAskAdmin(() => {
                setPickerQuery(
                  [trip.city, trip.country, 'travel photography']
                    .filter(Boolean)
                    .join(' '),
                )
                setPickerOpen(true)
              })
            }
            className="rounded-full border border-sea/30 px-5 py-2.5 text-sm font-medium text-sea-deep"
          >
            Hero 사진 고르기
          </button>
          <button
            type="button"
            onClick={() => runOrAskAdmin(() => void handleCaptions())}
            disabled={captionBusy || dayPhotos.length === 0}
            className="rounded-full border border-sea/30 px-5 py-2.5 text-sm font-medium text-sea-deep disabled:opacity-60"
          >
            {captionBusy ? '캡션 생성 중…' : '사진 캡션 생성'}
          </button>
        </div>

        {!isAdmin ? (
          <p className="text-sm text-ink-muted">
            글쓰기·AI·Unsplash는 관리자 인증 후 사용할 수 있습니다. 상단의
            「글쓰기 인증」을 이용하세요.
          </p>
        ) : null}

        {unsplashMeta ? (
          <p className="text-sm text-ink-muted">
            Unsplash · {unsplashMeta.photographer}
            {unsplashMeta.tags.length > 0
              ? ` · ${unsplashMeta.tags.slice(0, 6).join(', ')}`
              : ''}
          </p>
        ) : null}

        {message ? (
          <p className="rounded-xl bg-mist/50 px-4 py-3 text-sm text-sea-deep">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="rounded-xl bg-coral/10 px-4 py-3 text-sm text-coral">
            {error}
          </p>
        ) : null}

        <label className="block text-sm">
          <span className="mb-1 block text-ink-muted">제목</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-sand bg-paper px-3 py-2 font-display text-xl outline-none ring-sea focus:ring-2"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-ink-muted">여행기</span>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            className="w-full rounded-xl border border-sand bg-paper px-4 py-3 leading-relaxed outline-none ring-sea focus:ring-2"
          />
        </label>

        {snsSummary ? (
          <blockquote className="border-l-4 border-coral pl-4 font-display text-xl leading-snug text-sea-deep">
            {snsSummary}
          </blockquote>
        ) : null}

        {hashtags.length > 0 ? (
          <p className="text-sm text-ink-muted">
            {hashtags.map((t) => `#${t}`).join(' ')}
          </p>
        ) : null}

        <div>
          <h2 className="mb-4 font-display text-2xl text-sea-deep">
            Day {day} photos
          </h2>
          <PhotoGrid photos={dayPhotos.length > 0 ? dayPhotos : photos.slice(0, 6)} />
        </div>
      </div>

      <UnsplashPicker
        open={pickerOpen}
        initialQuery={
          pickerQuery ||
          [trip.city, trip.country, 'travel photography'].filter(Boolean).join(' ')
        }
        onClose={() => setPickerOpen(false)}
        onApply={applyHero}
      />
      {gateModal}
    </article>
  )
}
