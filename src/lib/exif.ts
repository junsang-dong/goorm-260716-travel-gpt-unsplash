import exifr from 'exifr'

export interface ExifData {
  latitude: number | null
  longitude: number | null
  date: string | null
  camera: string | null
  lens: string | null
}

export async function parseExif(file: File | Blob): Promise<ExifData> {
  try {
    const data = await exifr.parse(file, {
      gps: true,
      pick: [
        'latitude',
        'longitude',
        'DateTimeOriginal',
        'CreateDate',
        'Make',
        'Model',
        'LensModel',
        'Lens',
      ],
    })

    if (!data) {
      return {
        latitude: null,
        longitude: null,
        date: null,
        camera: null,
        lens: null,
      }
    }

    const dateRaw = data.DateTimeOriginal ?? data.CreateDate
    let date: string | null = null
    if (dateRaw instanceof Date) {
      date = dateRaw.toISOString()
    } else if (typeof dateRaw === 'string') {
      const parsed = new Date(dateRaw)
      date = Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
    }

    const make = typeof data.Make === 'string' ? data.Make : null
    const model = typeof data.Model === 'string' ? data.Model : null
    const camera = [make, model].filter(Boolean).join(' ') || null
    const lens =
      (typeof data.LensModel === 'string' && data.LensModel) ||
      (typeof data.Lens === 'string' && data.Lens) ||
      null

    return {
      latitude: typeof data.latitude === 'number' ? data.latitude : null,
      longitude: typeof data.longitude === 'number' ? data.longitude : null,
      date,
      camera,
      lens,
    }
  } catch {
    return {
      latitude: null,
      longitude: null,
      date: null,
      camera: null,
      lens: null,
    }
  }
}

export async function createThumbnail(
  file: File | Blob,
  maxSize = 480,
): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    return file
  }
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob ?? file),
      'image/jpeg',
      0.82,
    )
  })
}

export function tripDayNumber(
  photoDate: string | null,
  tripStart: string,
): number {
  const start = new Date(tripStart)
  start.setHours(0, 0, 0, 0)
  const photo = photoDate ? new Date(photoDate) : new Date()
  photo.setHours(0, 0, 0, 0)
  const diff = Math.floor((photo.getTime() - start.getTime()) / 86_400_000)
  return Math.max(1, diff + 1)
}
