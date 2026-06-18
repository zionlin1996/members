import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/browser'

const BASE = import.meta.env.VITE_API_URL

// ── Auth token bridge ────────────────────────────────────────────────────────
// The access token lives in memory only (never localStorage) — the httpOnly
// refresh cookie re-establishes the session on reload via refreshTokens().
// AuthContext is the React mirror of this module-scoped source of truth.

let accessToken: string | null = null
let onUnauthorized: (() => void) | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function getAccessToken() {
  return accessToken
}

/** Registered by AuthContext so a failed silent refresh can flip the UI to anonymous. */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler
}

type RequestOptions = RequestInit & {
  /** Skip the transparent 401→refresh→retry (used by login/refresh themselves). */
  skipAuthRetry?: boolean
}

async function parseBody(res: Response) {
  if (res.status === 204) return undefined
  const text = await res.text()
  return text ? JSON.parse(text) : undefined
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { skipAuthRetry, ...init } = options

  const send = () =>
    fetch(`${BASE}${path}`, {
      credentials: 'include',
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...init.headers,
      },
    })

  let res = await send()

  // Transparent one-shot refresh on an expired access token.
  if (res.status === 401 && !skipAuthRetry) {
    try {
      await refreshTokens()
      res = await send()
    } catch {
      accessToken = null
      onUnauthorized?.()
    }
  }

  const body = await parseBody(res)
  if (!res.ok) throw new Error(body?.message ?? `Request failed (${res.status})`)
  return body as T
}

// ── Session ──────────────────────────────────────────────────────────────────

export type Member = {
  id: string
  displayName: string
  username: string
  status: 'UNVERIFIED' | 'ACTIVE' | string
  createdAt: string
  updatedAt: string
}

export function login(payload: { username: string; password: string }) {
  return request<{ accessToken: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
    skipAuthRetry: true,
  })
}

export function passkeyLoginStart(username?: string) {
  return request<{ sessionId: string; options: PublicKeyCredentialRequestOptionsJSON }>(
    '/auth/login/passkey/start',
    {
      method: 'POST',
      body: JSON.stringify(username ? { username } : {}),
      skipAuthRetry: true,
    },
  )
}

export function passkeyLoginFinish(payload: {
  sessionId: string
  credential: AuthenticationResponseJSON
}) {
  return request<{ accessToken: string }>('/auth/login/passkey/finish', {
    method: 'POST',
    body: JSON.stringify(payload),
    skipAuthRetry: true,
  })
}

/** Exchanges the httpOnly refresh cookie for a fresh access token (rotates it). */
export async function refreshTokens() {
  const { accessToken: token } = await request<{ accessToken: string }>('/auth/refresh', {
    method: 'POST',
    skipAuthRetry: true,
  })
  accessToken = token
  return token
}

export function getMe() {
  return request<Member>('/auth/me')
}

export function telegramLogin(payload: { telegramData: TelegramAuthData }) {
  return request<{ accessToken: string }>('/auth/login/telegram', {
    method: 'POST',
    body: JSON.stringify(payload),
    skipAuthRetry: true,
  })
}

export async function logout() {
  await request<void>('/auth/logout', { method: 'POST', skipAuthRetry: true })
  accessToken = null
}

// ── Password registration ──────────────────────────────────────────────────

export function passwordRegister(payload: {
  displayName: string
  username: string
  password: string
  backupEmail: string
}) {
  return request<{ id: string; username: string; status: string }>('/auth/register/password', {
    method: 'POST',
    body: JSON.stringify({
      displayName: payload.displayName,
      username: payload.username,
      password: payload.password,
      backupEmail: payload.backupEmail,
    }),
  })
}

// ── Passkey registration ───────────────────────────────────────────────────

export type PasskeyStartPayload = {
  displayName: string
  username: string
  backupEmail: string
}

export type PasskeyStartResult = {
  sessionId: string
  options: PublicKeyCredentialCreationOptionsJSON
}

export function passkeyRegisterStart(payload: PasskeyStartPayload) {
  return request<PasskeyStartResult>('/auth/register/passkey/start', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export type PasskeyFinishPayload = {
  sessionId: string
  credential: RegistrationResponseJSON
}

export function passkeyRegisterFinish(payload: PasskeyFinishPayload) {
  return request<{ id: string; username: string; status: string }>(
    '/auth/register/passkey/finish',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  )
}

// ── Telegram registration ──────────────────────────────────────────────────

export type TelegramAuthData = {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
  hash: string
}

export function telegramRegister(payload: {
  displayName: string
  username: string
  telegramData: TelegramAuthData
}) {
  return request<{ id: string; username: string; status: string }>('/auth/register/telegram', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
