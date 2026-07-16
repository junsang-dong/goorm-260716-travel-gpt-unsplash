import { Link } from 'react-router-dom'
import type { Story } from '@/lib/types'

export function TimelineView({
  tripId,
  stories,
  maxDay,
}: {
  tripId: string
  stories: Story[]
  maxDay: number
}) {
  const days = Array.from({ length: Math.max(maxDay, 1) }, (_, i) => i + 1)

  return (
    <ol className="relative space-y-0 border-l-2 border-sea/25 pl-8">
      {days.map((day) => {
        const story = stories.find((s) => s.day === day)
        return (
          <li key={day} className="relative pb-10 last:pb-0">
            <span className="absolute -left-[2.4rem] top-1 flex h-7 w-7 items-center justify-center rounded-full bg-sea text-xs font-semibold text-paper">
              {day}
            </span>
            <div className="rounded-2xl bg-paper/80 p-5 shadow-[0_8px_30px_rgba(28,25,23,0.06)] ring-1 ring-sand">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-display text-xl text-sea-deep">
                  Day {day}
                  {story?.title ? ` · ${story.title}` : ''}
                </h3>
                {story?.mood ? (
                  <span className="rounded-full bg-mist px-3 py-1 text-xs font-medium text-sea-deep">
                    {story.mood}
                  </span>
                ) : null}
              </div>
              {story?.content ? (
                <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-ink-muted">
                  {story.content}
                </p>
              ) : (
                <p className="mb-4 text-sm text-ink-muted">
                  아직 이 날의 여행기가 없습니다. AI로 작성해 보세요.
                </p>
              )}
              <Link
                to={`/trips/${tripId}/story/${day}`}
                className="inline-flex items-center rounded-full bg-sea px-4 py-2 text-sm font-medium text-paper transition hover:bg-sea-deep"
              >
                {story ? '여행기 보기·편집' : 'AI로 여행기 작성'}
              </Link>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
