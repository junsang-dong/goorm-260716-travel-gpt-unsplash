import { useState } from 'react'
import { useAdmin } from '@/context/AdminContext'

export function AdminLoginModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}) {
  const { login } = useAdmin()
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await login(code)
      setCode('')
      onSuccess?.()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : '인증 실패')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/45 p-4 sm:items-center">
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="w-full max-w-sm rounded-2xl bg-paper p-6 shadow-2xl"
      >
        <h3 className="font-display text-2xl text-sea-deep">관리자 인증</h3>
        <p className="mt-2 text-sm text-ink-muted">
          여행 글쓰기(생성·AI 작성·사진 보강)는 관리자 코드가 필요합니다.
        </p>
        <label className="mt-5 block text-sm">
          <span className="mb-1 block text-ink-muted">관리자 코드</span>
          <input
            type="password"
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full rounded-xl border border-sand bg-paper px-3 py-2 outline-none ring-sea focus:ring-2"
            placeholder="관리자 코드를 입력하세요"
          />
        </label>
        {error ? (
          <p className="mt-3 text-sm text-coral">{error}</p>
        ) : null}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-sm text-ink-muted hover:bg-sand"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={busy || !code.trim()}
            className="rounded-full bg-sea px-5 py-2 text-sm font-medium text-paper disabled:opacity-60"
          >
            {busy ? '확인 중…' : '인증하기'}
          </button>
        </div>
      </form>
    </div>
  )
}
