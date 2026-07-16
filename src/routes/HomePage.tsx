import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { createTrip, listTrips } from '@/lib/db'
import { formatDateRange } from '@/lib/hooks'
import {
  parsePlace,
  TRIP_FORM_EXAMPLES,
  type TripFormExample,
} from '@/lib/tripExamples'
import type { Trip } from '@/lib/types'

const EMPTY_FORM = {
  title: '',
  description: '',
  place: '',
  date: '',
}

export function HomePage() {
  const navigate = useNavigate()
  const [trips, setTrips] = useState<Trip[]>([])
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    void listTrips().then(setTrips)
  }, [])

  function applyExample(example: TripFormExample) {
    setForm({
      title: example.title,
      description: example.description,
      place: example.place,
      date: example.date,
    })
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    try {
      const { country, city } = parsePlace(form.place)
      const date = form.date
      const trip = await createTrip({
        title: form.title.trim(),
        country,
        city,
        startDate: date,
        endDate: date,
        summary: form.description.trim(),
      })
      setOpen(false)
      setForm(EMPTY_FORM)
      navigate(`/trips/${trip.id}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              'linear-gradient(120deg, rgba(22,57,68,.88), rgba(31,78,95,.55)), url(https://images.unsplash.com/photo-1488646953017-aa797bffe247?auto=format&fit=crop&w=1800&q=80)',
          }}
        />
        <div className="relative mx-auto flex min-h-[72dvh] max-w-6xl flex-col justify-end px-5 pb-16 pt-24">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-mist"
          >
            Travel journal
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="font-display text-4xl font-semibold leading-tight text-paper text-balance sm:text-6xl"
          >
            AI Travel Story Writer
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="mt-4 max-w-xl text-lg text-paper/85"
          >
            사진을 올리면 AI가 장소·분위기를 읽고, 하루의 여행기를 써 줍니다.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8"
          >
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="rounded-full bg-coral px-6 py-3 text-sm font-semibold text-paper shadow-lg transition hover:brightness-110"
            >
              새 여행 시작하기
            </button>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl text-sea-deep">Your journeys</h2>
            <p className="mt-1 text-ink-muted">브라우저에 안전하게 저장된 여행 기록</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="hidden rounded-full border border-sea/30 px-4 py-2 text-sm font-medium text-sea-deep hover:bg-sand sm:inline-flex"
          >
            + New
          </button>
        </div>

        {trips.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-sand bg-paper/50 px-6 py-16 text-center">
            <p className="font-display text-2xl text-sea-deep">아직 여행이 없습니다</p>
            <p className="mt-2 text-ink-muted">첫 여행을 만들고 사진을 올려 보세요.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {trips.map((trip, i) => (
              <motion.div
                key={trip.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={`/trips/${trip.id}`}
                  className="group block overflow-hidden rounded-2xl bg-paper ring-1 ring-sand transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-sand">
                    {trip.coverImageUrl ? (
                      <img
                        src={trip.coverImageUrl}
                        alt=""
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-end bg-[linear-gradient(135deg,#1f4e5f,#8fa8ae)] p-4">
                        <span className="font-display text-2xl text-paper/90">
                          {trip.city || trip.country || trip.title}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-display text-xl text-ink">{trip.title}</h3>
                    <p className="mt-1 text-sm text-ink-muted">
                      {[trip.city, trip.country].filter(Boolean).join(', ')}
                    </p>
                    <p className="mt-2 text-xs text-ink-muted">
                      {formatDateRange(trip.startDate, trip.endDate)}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center">
          <form
            onSubmit={handleCreate}
            className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl bg-paper p-6 shadow-2xl"
          >
            <h3 className="font-display text-2xl text-sea-deep">새 여행</h3>

            <div className="mt-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-muted">
                예시로 시작하기
              </p>
              <div className="flex flex-wrap gap-2">
                {TRIP_FORM_EXAMPLES.map((example) => (
                  <button
                    key={example.id}
                    type="button"
                    onClick={() => applyExample(example)}
                    className="rounded-full border border-sand bg-sand/40 px-3 py-1.5 text-left text-xs font-medium text-sea-deep transition hover:border-sea/30 hover:bg-mist/60"
                  >
                    {example.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <label className="block text-sm">
                <span className="mb-1 block text-ink-muted">여행 제목</span>
                <input
                  required
                  type="text"
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  placeholder="예: 노을을 따라 달린 리스본의 노란 트램"
                  className="w-full rounded-xl border border-sand bg-paper px-3 py-2 outline-none ring-sea focus:ring-2"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block text-ink-muted">
                  여행에 대한 간단한 설명글
                </span>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  rows={4}
                  placeholder="그날의 분위기나 특별한 순간을 짧게 적어 주세요."
                  className="w-full resize-y rounded-xl border border-sand bg-paper px-3 py-2 leading-relaxed outline-none ring-sea focus:ring-2"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block text-ink-muted">국가 또는 도시</span>
                <input
                  type="text"
                  value={form.place}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, place: e.target.value }))
                  }
                  placeholder="예: 🇵🇹 Portugal · Lisbon"
                  className="w-full rounded-xl border border-sand bg-paper px-3 py-2 outline-none ring-sea focus:ring-2"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block text-ink-muted">여행 날짜</span>
                <input
                  required
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, date: e.target.value }))
                  }
                  className="w-full rounded-xl border border-sand bg-paper px-3 py-2 outline-none ring-sea focus:ring-2"
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  setForm(EMPTY_FORM)
                }}
                className="rounded-full px-4 py-2 text-sm text-ink-muted hover:bg-sand"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-sea px-5 py-2 text-sm font-medium text-paper hover:bg-sea-deep disabled:opacity-60"
              >
                {saving ? '생성 중…' : '만들기'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  )
}
