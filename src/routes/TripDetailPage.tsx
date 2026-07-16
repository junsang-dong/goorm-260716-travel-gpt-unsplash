import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  addLocation,
  addPhoto,
  clearLocationsForTrip,
  deleteTrip,
  getTrip,
  listLocations,
  listPhotos,
  listStories,
  updateTrip,
} from '@/lib/db'
import { createThumbnail, parseExif, tripDayNumber } from '@/lib/exif'
import { detailToUnsplashMeta } from '@/lib/api'
import { formatDateRange, tripDurationNights } from '@/lib/hooks'
import type { Location, Photo, Story, Trip } from '@/lib/types'
import { PhotoDropzone } from '@/components/PhotoDropzone'
import { PhotoGrid } from '@/components/PhotoGrid'
import { TimelineView } from '@/components/TimelineView'
import { TripMap } from '@/components/TripMap'
import { UnsplashPicker } from '@/components/UnsplashPicker'
import type { UnsplashPhotoDetail } from '@/lib/api'
import { useAdminGate } from '@/hooks/useAdminGate'

export function TripDetailPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const navigate = useNavigate()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [stories, setStories] = useState<Story[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [tab, setTab] = useState<'overview' | 'photos' | 'timeline' | 'map'>(
    'overview',
  )
  const [pickerOpen, setPickerOpen] = useState(false)
  const [heroError, setHeroError] = useState<string | null>(null)
  const { runOrAskAdmin, gateModal } = useAdminGate()

  const reload = useCallback(async () => {
    if (!tripId) return
    const [t, p, s, l] = await Promise.all([
      getTrip(tripId),
      listPhotos(tripId),
      listStories(tripId),
      listLocations(tripId),
    ])
    if (!t) {
      navigate('/')
      return
    }
    setTrip(t)
    setPhotos(p)
    setStories(s)
    setLocations(l)
  }, [tripId, navigate])

  useEffect(() => {
    void reload()
  }, [reload])

  const maxDay = useMemo(() => {
    if (!trip) return 1
    const fromDates = photos.map((p) =>
      tripDayNumber(p.date, trip.startDate || trip.createdAt),
    )
    const fromStories = stories.map((s) => s.day)
    const nights = tripDurationNights(trip.startDate, trip.endDate) + 1
    return Math.max(1, nights, ...fromDates, ...fromStories)
  }, [trip, photos, stories])

  const handleUpload = useCallback(
    async (files: File[]) => {
      if (!tripId || !trip) return
      for (const file of files) {
        const exif = await parseExif(file)
        const thumbnailBlob = await createThumbnail(file)
        const photo = await addPhoto({
          tripId,
          blob: file,
          thumbnailBlob,
          latitude: exif.latitude,
          longitude: exif.longitude,
          date: exif.date,
          camera: exif.camera,
          lens: exif.lens,
          aiCaption: null,
        })
        if (exif.latitude != null && exif.longitude != null) {
          await addLocation({
            tripId,
            name: [trip.city, trip.country].filter(Boolean).join(', ') || 'Waypoint',
            lat: exif.latitude,
            lng: exif.longitude,
            visitedAt: exif.date,
            photoId: photo.id,
          })
        }
      }
      await reload()
    },
    [tripId, trip, reload],
  )

  async function applyUnsplashHero(detail: UnsplashPhotoDetail) {
    if (!tripId) return
    setHeroError(null)
    try {
      await updateTrip(tripId, {
        coverImageUrl: detail.url,
        unsplashMeta: detailToUnsplashMeta(detail),
      })
      await reload()
    } catch (err) {
      setHeroError(err instanceof Error ? err.message : 'Hero 적용 실패')
      throw err
    }
  }

  const unsplashQuery = [trip?.city, trip?.country, 'travel photography']
    .filter(Boolean)
    .join(' ')

  async function handleDelete() {
    if (!tripId) return
    if (!confirm('이 여행과 사진·스토리를 모두 삭제할까요?')) return
    await clearLocationsForTrip(tripId)
    await deleteTrip(tripId)
    navigate('/')
  }

  if (!trip) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-20 text-center text-ink-muted">
        불러오는 중…
      </div>
    )
  }

  const tabs = [
    ['overview', 'Overview'],
    ['photos', 'Photos'],
    ['timeline', 'Timeline'],
    ['map', 'Map'],
  ] as const

  return (
    <div>
      <section className="relative min-h-[48dvh] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: trip.coverImageUrl
              ? `linear-gradient(180deg, rgba(22,57,68,.35), rgba(22,57,68,.75)), url(${trip.coverImageUrl})`
              : 'linear-gradient(135deg, #163944, #4d6f7a)',
          }}
        />
        <div className="relative mx-auto flex min-h-[48dvh] max-w-6xl flex-col justify-end px-5 pb-10 pt-16">
          <Link to="/" className="mb-6 text-sm text-paper/80 hover:text-paper">
            ← Journeys
          </Link>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-4xl font-semibold text-paper sm:text-5xl"
          >
            {trip.title}
          </motion.h1>
          <p className="mt-2 text-paper/85">
            {[trip.city, trip.country].filter(Boolean).join(', ')}
            {trip.startDate
              ? ` · ${formatDateRange(trip.startDate, trip.endDate)}`
              : ''}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => runOrAskAdmin(() => setPickerOpen(true))}
              className="rounded-full bg-paper/95 px-4 py-2 text-sm font-medium text-sea-deep hover:bg-paper"
            >
              Unsplash Hero 선택
            </button>
            <Link
              to={`/trips/${trip.id}/story/1`}
              className="rounded-full bg-coral px-4 py-2 text-sm font-semibold text-paper"
            >
              AI Writer
            </Link>
            <button
              type="button"
              onClick={() => runOrAskAdmin(() => void handleDelete())}
              className="rounded-full px-4 py-2 text-sm text-paper/80 hover:bg-paper/10"
            >
              삭제
            </button>
          </div>
          {trip.unsplashMeta?.photographer ? (
            <p className="mt-3 text-xs text-paper/75">
              Cover photo by {trip.unsplashMeta.photographer} on Unsplash
              {trip.unsplashMeta.tags?.length
                ? ` · ${trip.unsplashMeta.tags.slice(0, 4).join(', ')}`
                : ''}
            </p>
          ) : null}
          {heroError ? (
            <p className="mt-3 text-sm text-coral">{heroError}</p>
          ) : null}
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 py-8">
        <div className="mb-8 flex flex-wrap gap-2">
          {tabs.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                tab === id
                  ? 'bg-sea text-paper'
                  : 'bg-sand/60 text-ink-muted hover:bg-sand'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'overview' ? (
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <h2 className="font-display text-2xl text-sea-deep">Summary</h2>
              <p className="mt-3 leading-relaxed text-ink-muted">
                {trip.summary ||
                  stories[0]?.snsSummary ||
                  '사진과 AI 여행기를 추가하면 요약이 채워집니다.'}
              </p>
              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ['Photos', String(photos.length)],
                  ['Stories', String(stories.length)],
                  ['Days', String(maxDay)],
                  ['Pins', String(locations.length)],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-2xl bg-paper p-4 ring-1 ring-sand"
                  >
                    <p className="text-xs uppercase tracking-wide text-ink-muted">
                      {label}
                    </p>
                    <p className="mt-1 font-display text-2xl text-sea-deep">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h2 className="mb-4 font-display text-2xl text-sea-deep">
                Recent photos
              </h2>
              <PhotoGrid photos={photos.slice(0, 4)} />
            </div>
          </div>
        ) : null}

        {tab === 'photos' ? (
          <div className="space-y-6">
            <PhotoDropzone
              onFiles={(files) =>
                runOrAskAdmin(() => {
                  void handleUpload(files)
                })
              }
            />
            <PhotoGrid photos={photos} />
          </div>
        ) : null}

        {tab === 'timeline' ? (
          <TimelineView tripId={trip.id} stories={stories} maxDay={maxDay} />
        ) : null}

        {tab === 'map' ? (
          <TripMap locations={locations} photos={photos} />
        ) : null}
      </div>

      <UnsplashPicker
        open={pickerOpen}
        initialQuery={unsplashQuery}
        onClose={() => setPickerOpen(false)}
        onApply={applyUnsplashHero}
      />
      {gateModal}
    </div>
  )
}
