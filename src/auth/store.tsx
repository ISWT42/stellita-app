/* eslint-disable react-refresh/only-export-components --
   Context file: the provider and its hook are intentionally co-located. The
   rule is a dev-only fast-refresh hint and does not affect runtime. */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import { api } from '../lib/backend'

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8787'

export interface User {
  id: string
  name: string
  email: string
  avatar_url?: string
}

/** Server-computed prompt credits. limit/remaining === -1 means unlimited. */
export interface Credits {
  plan: string | null
  used: number
  limit: number
  remaining: number
  unlimited: boolean
}

interface AuthContextValue {
  user: User | null
  profile: unknown | null
  credits: Credits | null
  loading: boolean
  startOtp: (email: string) => Promise<void>
  verifyOtp: (email: string, token: string) => Promise<void>
  /** next = relative path to return to after the OAuth round-trip (defaults to
   *  the current URL). Lets the shared page return to itself instead of /app. */
  loginWithGoogle: (next?: string) => void
  logout: () => Promise<void>
  /** Re-read the current credit balance (call after a prompt is consumed). */
  refreshCredits: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<unknown | null>(null)
  const [credits, setCredits] = useState<Credits | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api<{ user: User; profile: unknown; credits: Credits | null }>('/auth/me')
      .then(({ user: u, profile: p, credits: c }) => {
        setUser(u)
        setProfile(p)
        setCredits(c ?? null)
      })
      .catch(() => {
        setUser(null)
        setProfile(null)
        setCredits(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const refreshCredits = useCallback(async () => {
    try {
      const { credits: c } = await api<{ credits: Credits | null }>('/auth/me')
      setCredits(c ?? null)
    } catch {
      // ignore — a transient failure shouldn't clear the displayed balance
    }
  }, [])

  const startOtp = async (email: string) => {
    await api('/auth/otp/start', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  }

  const verifyOtp = async (email: string, token: string) => {
    const { user: u } = await api<{ user: User }>('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ email, token }),
    })
    setUser(u)
    void refreshCredits()
  }

  const loginWithGoogle = (next?: string) => {
    const dest = next ?? window.location.pathname + window.location.search
    window.location.href = `${API_BASE}/auth/google?next=${encodeURIComponent(dest)}`
  }

  const logout = async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => {})
    setUser(null)
    setProfile(null)
    setCredits(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, profile, credits, loading, startOtp, verifyOtp, loginWithGoogle, logout, refreshCredits }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
