import { useEffect, useState } from 'react'

const urlCache = new WeakMap<Blob, string>()

export function useObjectUrl(blob: Blob | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!blob) {
      setUrl(null)
      return
    }
    let objectUrl = urlCache.get(blob)
    if (!objectUrl) {
      objectUrl = URL.createObjectURL(blob)
      urlCache.set(blob, objectUrl)
    }
    setUrl(objectUrl)
  }, [blob])

  return url
}

export function formatDateRange(start: string, end: string): string {
  if (!start && !end) return ''
  const fmt = (d: string) => {
    if (!d) return ''
    const date = new Date(d)
    if (Number.isNaN(date.getTime())) return d
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }
  if (start && end && start !== end) return `${fmt(start)} – ${fmt(end)}`
  return fmt(start || end)
}

export function tripDurationNights(start: string, end: string): number {
  if (!start || !end) return 0
  const s = new Date(start)
  const e = new Date(end)
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return 0
  return Math.max(0, Math.round((e.getTime() - s.getTime()) / 86_400_000))
}
