import { useEffect, useMemo, useState } from 'react'
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet'
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import 'leaflet/dist/leaflet.css'
import type { Location, Photo } from '@/lib/types'
import { useObjectUrl } from '@/lib/hooks'

// Vite: fix default marker icon asset paths
const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})
L.Marker.prototype.options.icon = DefaultIcon

export interface MapPin {
  id: string
  name: string
  lat: number
  lng: number
  visitedAt: string | null
  photoId: string | null
}

function PinCard({
  photo,
  pin,
  active,
  onClick,
}: {
  photo?: Photo
  pin: MapPin
  active: boolean
  onClick: () => void
}) {
  const url = useObjectUrl(photo?.thumbnailBlob ?? photo?.blob)
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full gap-3 rounded-xl bg-paper/90 p-3 text-left ring-1 transition ${
        active ? 'ring-coral' : 'ring-sand hover:ring-sea/40'
      }`}
    >
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
        <p className="truncate font-medium text-ink">{pin.name}</p>
        <p className="text-xs text-ink-muted">
          {pin.lat.toFixed(4)}, {pin.lng.toFixed(4)}
        </p>
        {pin.visitedAt ? (
          <p className="mt-1 text-xs text-ink-muted">
            {new Date(pin.visitedAt).toLocaleString('ko-KR')}
          </p>
        ) : null}
      </div>
    </button>
  )
}

function FitBounds({ pins }: { pins: MapPin[] }) {
  const map = useMap()
  useEffect(() => {
    if (pins.length === 0) return
    if (pins.length === 1) {
      map.setView([pins[0].lat, pins[0].lng], 13)
      return
    }
    const bounds = L.latLngBounds(pins.map((p) => [p.lat, p.lng] as [number, number]))
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
  }, [map, pins])
  return null
}

function FlyToPin({ pin }: { pin: MapPin | null }) {
  const map = useMap()
  useEffect(() => {
    if (!pin) return
    map.flyTo([pin.lat, pin.lng], Math.max(map.getZoom(), 13), { duration: 0.6 })
  }, [map, pin])
  return null
}

function PopupThumb({ photo }: { photo?: Photo }) {
  const url = useObjectUrl(photo?.thumbnailBlob ?? photo?.blob)
  if (!url) return null
  return (
    <img
      src={url}
      alt={photo?.aiCaption ?? ''}
      className="mb-2 h-24 w-full rounded-md object-cover"
    />
  )
}

function buildPins(locations: Location[], photos: Photo[]): MapPin[] {
  if (locations.length > 0) {
    return locations.map((loc) => ({
      id: loc.id,
      name: loc.name,
      lat: loc.lat,
      lng: loc.lng,
      visitedAt: loc.visitedAt,
      photoId: loc.photoId,
    }))
  }

  return photos
    .filter((p) => p.latitude != null && p.longitude != null)
    .map((p) => ({
      id: `photo-${p.id}`,
      name: p.aiCaption || 'Photo location',
      lat: p.latitude as number,
      lng: p.longitude as number,
      visitedAt: p.date,
      photoId: p.id,
    }))
}

export function TripMap({
  locations,
  photos,
}: {
  locations: Location[]
  photos: Photo[]
}) {
  const pins = useMemo(() => buildPins(locations, photos), [locations, photos])
  const photoMap = useMemo(() => new Map(photos.map((p) => [p.id, p])), [photos])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selectedPin = pins.find((p) => p.id === selectedId) ?? null
  const center: [number, number] =
    pins.length > 0 ? [pins[0].lat, pins[0].lng] : [37.57, 126.98]

  return (
    <div className="overflow-hidden rounded-2xl ring-1 ring-sand">
      <div className="relative h-64 sm:h-80">
        <MapContainer
          center={center}
          zoom={pins.length > 0 ? 12 : 5}
          className="h-full w-full z-0"
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds pins={pins} />
          <FlyToPin pin={selectedPin} />
          {pins.map((pin) => {
            const photo = pin.photoId ? photoMap.get(pin.photoId) : undefined
            return (
              <Marker
                key={pin.id}
                position={[pin.lat, pin.lng]}
                eventHandlers={{
                  click: () => setSelectedId(pin.id),
                }}
              >
                <Popup>
                  <div className="min-w-[140px] text-sm">
                    <PopupThumb photo={photo} />
                    <p className="font-medium">{pin.name}</p>
                    <p className="text-xs text-gray-600">
                      {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}
                    </p>
                    {pin.visitedAt ? (
                      <p className="mt-1 text-xs text-gray-500">
                        {new Date(pin.visitedAt).toLocaleString('ko-KR')}
                      </p>
                    ) : null}
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>
        <div className="pointer-events-none absolute left-3 top-3 z-[1000] rounded-full bg-paper/95 px-3 py-1 text-xs font-medium text-sea-deep shadow">
          OpenStreetMap · {pins.length} pins
        </div>
      </div>

      <div className="max-h-72 space-y-2 overflow-y-auto bg-sand/30 p-4">
        {pins.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-muted">
            GPS가 포함된 사진을 업로드하면 핀이 나타납니다.
          </p>
        ) : (
          pins.map((pin) => (
            <PinCard
              key={pin.id}
              pin={pin}
              photo={pin.photoId ? photoMap.get(pin.photoId) : undefined}
              active={selectedId === pin.id}
              onClick={() => setSelectedId(pin.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
