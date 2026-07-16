import type { Location, Photo } from '@/lib/types'
import { useObjectUrl } from '@/lib/hooks'

function PinCard({
  photo,
  location,
}: {
  photo?: Photo
  location: Location
}) {
  const url = useObjectUrl(photo?.thumbnailBlob ?? photo?.blob)
  return (
    <div className="flex gap-3 rounded-xl bg-paper/90 p-3 ring-1 ring-sand">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-sand">
        {url ? (
          <img src={url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-ink-muted">
            GPS
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate font-medium text-ink">{location.name}</p>
        <p className="text-xs text-ink-muted">
          {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
        </p>
        {location.visitedAt ? (
          <p className="mt-1 text-xs text-ink-muted">
            {new Date(location.visitedAt).toLocaleString('ko-KR')}
          </p>
        ) : null}
      </div>
    </div>
  )
}

export function MapMock({
  locations,
  photos,
}: {
  locations: Location[]
  photos: Photo[]
}) {
  const photoMap = new Map(photos.map((p) => [p.id, p]))

  const avgLat =
    locations.length > 0
      ? locations.reduce((s, l) => s + l.lat, 0) / locations.length
      : 37.57
  const avgLng =
    locations.length > 0
      ? locations.reduce((s, l) => s + l.lng, 0) / locations.length
      : 126.98

  return (
    <div className="overflow-hidden rounded-2xl ring-1 ring-sand">
      <div
        className="relative h-64 bg-[linear-gradient(160deg,#c5d5d8_0%,#8fa8ae_35%,#4d6f7a_70%,#1f4e5f_100%)] sm:h-80"
        aria-label="지도 목업"
      >
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 30%, rgba(255,255,255,.35) 0 2px, transparent 3px), radial-gradient(circle at 70% 60%, rgba(255,255,255,.25) 0 1.5px, transparent 2.5px), linear-gradient(90deg, transparent 49%, rgba(255,255,255,.15) 50%, transparent 51%), linear-gradient(0deg, transparent 49%, rgba(255,255,255,.12) 50%, transparent 51%)',
            backgroundSize: '80px 80px, 60px 60px, 40px 40px, 40px 40px',
          }}
        />
        <div className="absolute left-4 top-4 rounded-full bg-paper/90 px-3 py-1 text-xs font-medium text-sea-deep shadow">
          Map mock · {locations.length} pins
        </div>
        {locations.slice(0, 12).map((loc, i) => {
          const x = 20 + ((loc.lng - avgLng) * 800 + 50 + i * 7) % 70
          const y = 20 + ((avgLat - loc.lat) * 800 + 40 + i * 5) % 60
          return (
            <span
              key={loc.id}
              className="absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-coral shadow-md ring-2 ring-paper"
              style={{
                left: `${Math.min(90, Math.max(10, x))}%`,
                top: `${Math.min(85, Math.max(15, y))}%`,
              }}
              title={loc.name}
            />
          )
        })}
        <p className="absolute bottom-4 left-4 right-4 text-center text-xs text-paper/90">
          실제 Mapbox/Google Maps는 다음 단계에서 연결됩니다. EXIF GPS 핀을 미리보기로
          표시합니다.
        </p>
      </div>
      <div className="max-h-72 space-y-2 overflow-y-auto bg-sand/30 p-4">
        {locations.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-muted">
            GPS가 포함된 사진을 업로드하면 핀이 나타납니다.
          </p>
        ) : (
          locations.map((loc) => (
            <PinCard
              key={loc.id}
              location={loc}
              photo={loc.photoId ? photoMap.get(loc.photoId) : undefined}
            />
          ))
        )}
      </div>
    </div>
  )
}
