import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  clearStoredAdminCode,
  getStoredAdminCode,
  isAdminUnlocked,
  verifyAdminCode,
} from '@/lib/admin'

interface AdminContextValue {
  isAdmin: boolean
  login: (code: string) => Promise<void>
  logout: () => void
  requireAdmin: () => boolean
}

const AdminContext = createContext<AdminContextValue | null>(null)

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(() => isAdminUnlocked())

  const login = useCallback(async (code: string) => {
    await verifyAdminCode(code)
    setIsAdmin(true)
  }, [])

  const logout = useCallback(() => {
    clearStoredAdminCode()
    setIsAdmin(false)
  }, [])

  const requireAdmin = useCallback(() => {
    if (isAdmin && getStoredAdminCode()) return true
    return false
  }, [isAdmin])

  const value = useMemo(
    () => ({ isAdmin, login, logout, requireAdmin }),
    [isAdmin, login, logout, requireAdmin],
  )

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}

export function useAdmin() {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider')
  return ctx
}
