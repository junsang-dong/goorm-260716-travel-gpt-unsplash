import { useCallback, useState } from 'react'
import { useAdmin } from '@/context/AdminContext'
import { AdminLoginModal } from '@/components/AdminLoginModal'

/** Gate write actions: if not admin, open login modal; optionally run action after success */
export function useAdminGate() {
  const { isAdmin } = useAdmin()
  const [loginOpen, setLoginOpen] = useState(false)
  const [pending, setPending] = useState<(() => void) | null>(null)

  const runOrAskAdmin = useCallback(
    (action: () => void) => {
      if (isAdmin) {
        action()
        return
      }
      setPending(() => action)
      setLoginOpen(true)
    },
    [isAdmin],
  )

  const gateModal = (
    <AdminLoginModal
      open={loginOpen}
      onClose={() => {
        setLoginOpen(false)
        setPending(null)
      }}
      onSuccess={() => {
        pending?.()
        setPending(null)
      }}
    />
  )

  return { isAdmin, runOrAskAdmin, gateModal }
}
