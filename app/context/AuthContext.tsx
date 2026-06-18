import { createContext, useContext, useEffect, useState } from 'react'
import { startAuthentication } from '@simplewebauthn/browser'
import {
  getMe,
  login as apiLogin,
  logout as apiLogout,
  passkeyLoginFinish,
  passkeyLoginStart,
  refreshTokens,
  setAccessToken,
  setUnauthorizedHandler,
  telegramLogin,
  type Member,
  type TelegramAuthData,
} from '../libs/api'

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

type LoginFns = {
  password: (username: string, password: string) => Promise<void>
  passkey: (username?: string) => Promise<void>
  telegram: (telegramData: TelegramAuthData) => Promise<void>
}

type AuthContextValue = {
  status: AuthStatus
  member: Member | null
  login: <M extends keyof LoginFns>(method: M) => LoginFns[M]
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

// Co-located with the provider (mirrors RegisterContext); the disable is for the
// HMR-only Fast Refresh rule, which dislikes a hook export beside the component.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [member, setMember] = useState<Member | null>(null)

  async function establishSession() {
    const member = await getMe()
    setMember(member)
    setStatus('authenticated')
  }

  // Bootstrap: try to revive the session from the refresh cookie on load.
  useEffect(() => {
    let active = true

    setUnauthorizedHandler(() => {
      if (!active) return
      setMember(null)
      setStatus('anonymous')
    })
    ;(async () => {
      try {
        await refreshTokens()
        if (!active) return
        await establishSession()
      } catch {
        if (!active) return
        setMember(null)
        setStatus('anonymous')
      }
    })()

    return () => {
      active = false
      setUnauthorizedHandler(null)
    }
  }, [])

  const loginFns: LoginFns = {
    async password(username, password) {
      const { accessToken } = await apiLogin({ username, password })
      setAccessToken(accessToken)
      await establishSession()
    },
    async passkey(username) {
      const { sessionId, options } = await passkeyLoginStart(username)
      const credential = await startAuthentication({ optionsJSON: options })
      const { accessToken } = await passkeyLoginFinish({ sessionId, credential })
      setAccessToken(accessToken)
      await establishSession()
    },
    async telegram(telegramData) {
      const { accessToken } = await telegramLogin({ telegramData })
      setAccessToken(accessToken)
      await establishSession()
    },
  }

  function login<M extends keyof LoginFns>(method: M): LoginFns[M] {
    return loginFns[method]
  }

  async function logout() {
    try {
      await apiLogout()
    } finally {
      setMember(null)
      setStatus('anonymous')
    }
  }

  return (
    <AuthContext.Provider value={{ status, member, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
