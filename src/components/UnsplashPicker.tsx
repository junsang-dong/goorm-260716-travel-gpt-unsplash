import { useEffect, useState } from 'react'
import {
  formatUnsplashLocation,
  getUnsplashPhoto,
  searchUnsplash,
  trackUnsplashDownload,
  type UnsplashPhoto,
  type UnsplashPhotoDetail,
} from '@/lib/api'

interface UnsplashPickerProps {
  open: boolean
  initialQuery: string
  onClose: () => void
  onApply: (detail: UnsplashPhotoDetail) => void | Promise<void>
}

export function UnsplashPicker({
  open,
  initialQuery,
  onClose,
  onApply,
}: UnsplashPickerProps) {
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<UnsplashPhoto[]>([])
  const [selected, setSelected] = useState<UnsplashPhotoDetail | null>(null)
  const [searching, setSearching] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setQuery(initialQuery)
    setSelected(null)
    setError(null)
    setSearching(true)
    void searchUnsplash(initialQuery || 'travel photography', 9)
      .then((photos) => {
        setResults(photos)
        if (photos.length === 0) {
          setError('검색 결과가 없습니다. 다른 키워드를 시도해 보세요.')
        }
      })
      .catch((err: unknown) => {
        setResults([])
        setError(err instanceof Error ? err.message : '검색 실패')
      })
      .finally(() => setSearching(false))
  }, [open, initialQuery])

  async function runSearch(q: string) {
    setSearching(true)
    setError(null)
    setSelected(null)
    try {
      const photos = await searchUnsplash(q || 'travel photography', 9)
      setResults(photos)
      if (photos.length === 0) {
        setError('검색 결과가 없습니다. 다른 키워드를 시도해 보세요.')
      }
    } catch (err) {
      setResults([])
      setError(err instanceof Error ? err.message : '검색 실패')
    } finally {
      setSearching(false)
    }
  }

  async function handleSelect(photo: UnsplashPhoto) {
    setLoadingDetail(true)
    setError(null)
    try {
      const detail = await getUnsplashPhoto(photo.id)
      setSelected(detail)
    } catch (err) {
      setError(err instanceof Error ? err.message : '상세 정보 로드 실패')
    } finally {
      setLoadingDetail(false)
    }
  }

  async function handleApply() {
    if (!selected) return
    setApplying(true)
    setError(null)
    try {
      await trackUnsplashDownload(selected.downloadLocation)
      await onApply(selected)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : '적용 실패')
    } finally {
      setApplying(false)
    }
  }

  if (!open) return null

  const locationLabel = selected
    ? formatUnsplashLocation(selected.location)
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/45 p-4 sm:items-center">
      <div className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-paper shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-sand px-5 py-4">
          <div>
            <h3 className="font-display text-2xl text-sea-deep">Unsplash 사진 선택</h3>
            <p className="mt-1 text-sm text-ink-muted">
              검색 후 사진을 고르면 위치·태그·설명을 확인할 수 있습니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1 text-sm text-ink-muted hover:bg-sand"
          >
            닫기
          </button>
        </div>

        <form
          className="flex gap-2 border-b border-sand px-5 py-3"
          onSubmit={(e) => {
            e.preventDefault()
            void runSearch(query)
          }}
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="예: Lisbon yellow tram sunset"
            className="min-w-0 flex-1 rounded-xl border border-sand bg-paper px-3 py-2 text-sm outline-none ring-sea focus:ring-2"
          />
          <button
            type="submit"
            disabled={searching}
            className="shrink-0 rounded-full bg-sea px-4 py-2 text-sm font-medium text-paper disabled:opacity-60"
          >
            {searching ? '검색 중…' : '검색'}
          </button>
        </form>

        <div className="grid min-h-0 flex-1 gap-0 overflow-hidden lg:grid-cols-[1.2fr_0.9fr]">
          <div className="overflow-y-auto p-4">
            {results.length === 0 && !searching ? (
              <p className="py-10 text-center text-sm text-ink-muted">
                검색 결과가 여기에 표시됩니다.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {results.map((photo) => {
                  const active = selected?.id === photo.id
                  return (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => void handleSelect(photo)}
                      className={`overflow-hidden rounded-xl text-left ring-2 transition ${
                        active
                          ? 'ring-coral'
                          : 'ring-transparent hover:ring-sea/40'
                      }`}
                    >
                      <div className="aspect-[4/3] bg-sand">
                        <img
                          src={photo.thumb}
                          alt={photo.alt}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <p className="truncate px-2 py-1.5 text-xs text-ink-muted">
                        {photo.photographer}
                      </p>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="border-t border-sand bg-sand/25 p-4 lg:border-l lg:border-t-0">
            {loadingDetail ? (
              <p className="text-sm text-ink-muted">상세 정보를 불러오는 중…</p>
            ) : selected ? (
              <div className="space-y-3 text-sm">
                <img
                  src={selected.url}
                  alt={selected.alt}
                  className="aspect-video w-full rounded-xl object-cover"
                />
                <div>
                  <p className="font-medium text-ink">{selected.alt}</p>
                  <p className="mt-1 text-ink-muted">
                    Photo by{' '}
                    <a
                      href={`${selected.photographerUrl}?utm_source=ai_travel_story_writer&utm_medium=referral`}
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                    >
                      {selected.photographer}
                    </a>{' '}
                    on{' '}
                    <a
                      href="https://unsplash.com/?utm_source=ai_travel_story_writer&utm_medium=referral"
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                    >
                      Unsplash
                    </a>
                  </p>
                </div>
                {selected.description ? (
                  <p className="leading-relaxed text-ink-muted">
                    {selected.description}
                  </p>
                ) : null}
                {locationLabel ? (
                  <p>
                    <span className="text-ink-muted">위치 · </span>
                    {locationLabel}
                  </p>
                ) : (
                  <p className="text-ink-muted">위치 정보 없음</p>
                )}
                {selected.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {selected.tags.slice(0, 12).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-paper px-2.5 py-1 text-xs text-sea-deep ring-1 ring-sand"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-ink-muted">태그 없음</p>
                )}
                {selected.exif?.make || selected.exif?.model ? (
                  <p className="text-ink-muted">
                    카메라 ·{' '}
                    {[selected.exif.make, selected.exif.model]
                      .filter(Boolean)
                      .join(' ')}
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-ink-muted">
                사진을 선택하면 위치·태그·EXIF가 여기에 표시됩니다.
              </p>
            )}
          </div>
        </div>

        {error ? (
          <p className="border-t border-sand px-5 py-2 text-sm text-coral">{error}</p>
        ) : null}

        <div className="flex justify-end gap-2 border-t border-sand px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-sm text-ink-muted hover:bg-sand"
          >
            취소
          </button>
          <button
            type="button"
            disabled={!selected || applying}
            onClick={() => void handleApply()}
            className="rounded-full bg-coral px-5 py-2 text-sm font-semibold text-paper disabled:opacity-60"
          >
            {applying ? '적용 중…' : '이 사진 적용'}
          </button>
        </div>
      </div>
    </div>
  )
}
