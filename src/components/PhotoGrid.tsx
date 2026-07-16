import type { Photo } from '@/lib/types'
import { useObjectUrl } from '@/lib/hooks'

function PhotoThumb({
  photo,
  onClick,
}: {
  photo: Photo
  onClick?: () => void
}) {
  const url = useObjectUrl(photo.thumbnailBlob || photo.blob)
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative aspect-[4/5] overflow-hidden rounded-xl bg-sand text-left"
    >
      {url ? (
        <img
          src={url}
          alt={photo.aiCaption ?? 'Travel photo'}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      ) : null}
      {photo.aiCaption ? (
        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 to-transparent p-3 text-xs text-paper opacity-0 transition group-hover:opacity-100">
          {photo.aiCaption}
        </span>
      ) : null}
    </button>
  )
}

export function PhotoGrid({
  photos,
  onSelect,
}: {
  photos: Photo[]
  onSelect?: (photo: Photo) => void
}) {
  if (photos.length === 0) {
    return (
      <p className="rounded-xl bg-sand/50 px-4 py-8 text-center text-sm text-ink-muted">
        아직 업로드된 사진이 없습니다.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {photos.map((photo) => (
        <PhotoThumb
          key={photo.id}
          photo={photo}
          onClick={onSelect ? () => onSelect(photo) : undefined}
        />
      ))}
    </div>
  )
}
