import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col">
      <header className="sticky top-0 z-40 border-b border-sand/80 bg-paper/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <Link to="/" className="group flex items-baseline gap-2">
            <span className="font-display text-xl font-semibold tracking-tight text-sea-deep sm:text-2xl">
              AI Travel Story Writer
            </span>
          </Link>
          <nav className="flex items-center gap-1 text-sm font-medium text-ink-muted">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `rounded-full px-3 py-1.5 transition ${
                  isActive ? 'bg-sea text-paper' : 'hover:bg-sand hover:text-ink'
                }`
              }
              end
            >
              Journeys
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-sand/80 px-5 py-6 text-center text-sm text-ink-muted">
        여행이 끝난 뒤가 아니라, 여행을 하나의 이야기로 만듭니다.
      </footer>
    </div>
  )
}
