import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react'

type User = { userId: string; username: string }

type AuthContextValue = {
  user: User | null
  accessToken: string | null
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
  authFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
}

const AuthContext = createContext<AuthContextValue | null>(null)

type AuthResponse = { accessToken: string; user: User }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const refreshingRef = useRef<Promise<void> | null>(null)
  const accessTokenRef = useRef<string | null>(null)

  const setSession = useCallback((data: AuthResponse) => {
    accessTokenRef.current = data.accessToken
    setAccessToken(data.accessToken)
    setUser(data.user)
  }, [])

  const clearSession = useCallback(() => {
    accessTokenRef.current = null
    setAccessToken(null)
    setUser(null)
  }, [])

  const register = useCallback(
    async (username: string, password: string) => {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      })
      const data = (await res.json().catch(() => null)) as AuthResponse | { error?: string } | null
      if (!res.ok) throw new Error((data as any)?.error ?? 'Register failed')
      setSession(data as AuthResponse)
    },
    [setSession],
  )

  const login = useCallback(
    async (username: string, password: string) => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      })
      const data = (await res.json().catch(() => null)) as AuthResponse | { error?: string } | null
      if (!res.ok) throw new Error((data as any)?.error ?? 'Login failed')
      setSession(data as AuthResponse)
    },
    [setSession],
  )

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => null)
    clearSession()
  }, [clearSession])

  const refresh = useCallback(async () => {
    if (!refreshingRef.current) {
      refreshingRef.current = (async () => {
        try {
          const res = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' })
          const data = (await res.json().catch(() => null)) as AuthResponse | { error?: string } | null
          if (!res.ok) throw new Error((data as any)?.error ?? 'Refresh failed')
          setSession(data as AuthResponse)
        } catch {
          clearSession()
          throw new Error('Refresh failed')
        } finally {
          refreshingRef.current = null
        }
      })()
    }
    return await refreshingRef.current
  }, [clearSession, setSession])

  const authFetch = useCallback(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const doFetch = (token: string | null) => {
        const headers = new Headers(init?.headers)
        if (token) headers.set('Authorization', `Bearer ${token}`)
        return fetch(input, { ...init, headers, credentials: 'include' })
      }

      const res = await doFetch(accessTokenRef.current)
      if (res.status !== 401) return res

      // Try refresh once, then retry request.
      await refresh()
      return await doFetch(accessTokenRef.current)
    },
    [refresh],
  )

  const value = useMemo<AuthContextValue>(
    () => ({ user, accessToken, login, register, logout, refresh, authFetch }),
    [user, accessToken, login, register, logout, refresh, authFetch],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

