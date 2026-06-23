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

function post<T>(
  path: string,
  body?: unknown,
  opts?: Pick<RequestOptions, 'skipAuthRetry'>,
): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    ...(body !== undefined && { body: JSON.stringify(body) }),
    ...opts,
  })
}

function patch<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: 'PATCH', body: JSON.stringify(body) })
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
  return post<{ accessToken: string }>('/auth/login', payload, { skipAuthRetry: true })
}

export function passkeyLoginStart(username?: string) {
  return post<{ sessionId: string; options: PublicKeyCredentialRequestOptionsJSON }>(
    '/auth/login/passkey/start',
    username ? { username } : {},
    { skipAuthRetry: true },
  )
}

export function passkeyLoginFinish(payload: {
  sessionId: string
  credential: AuthenticationResponseJSON
}) {
  return post<{ accessToken: string }>('/auth/login/passkey/finish', payload, {
    skipAuthRetry: true,
  })
}

/** Exchanges the httpOnly refresh cookie for a fresh access token (rotates it). */
export async function refreshTokens() {
  const { accessToken: token } = await post<{ accessToken: string }>('/auth/refresh', undefined, {
    skipAuthRetry: true,
  })
  accessToken = token
  return token
}

export function getMe() {
  return request<Member>('/auth/me')
}

export function telegramLogin(payload: { telegramData: TelegramAuthData }) {
  return post<{ accessToken: string }>('/auth/login/telegram', payload, { skipAuthRetry: true })
}

// Google OAuth is a full-page redirect flow (not XHR): navigate the browser to
// these. The API callback sets the refresh cookie and 302s back to the app,
// where AuthContext revives the session via /auth/refresh on load.
export const googleLoginUrl = () => `${BASE}/auth/login/google`
export const googleRegisterUrl = (displayName: string, username: string) =>
  `${BASE}/auth/register/google?displayName=${encodeURIComponent(displayName)}&username=${encodeURIComponent(username)}`

export async function logout() {
  await post<void>('/auth/logout', undefined, { skipAuthRetry: true })
  accessToken = null
}

export function checkAvailability(username: string, signal?: AbortSignal) {
  return request<{ username: { available: boolean } }>(
    `/auth/availability?username=${encodeURIComponent(username)}`,
    { signal },
  )
}

// ── Profile ────────────────────────────────────────────────────────────────

export type Profile = {
  givenName: string | null
  familyName: string | null
  middleName: string | null
  nickname: string | null
  birthdate: string | null
  gender: string | null
  pronouns: string | null
  locale: string | null
  zoneinfo: string | null
  picture: string | null
  website: string | null
  profileUrl: string | null
  phoneNumber: string | null
  phoneVerified: boolean
  streetAddress: string | null
  locality: string | null
  region: string | null
  postalCode: string | null
  country: string | null
  createdAt: string | null
  updatedAt: string | null
}

type ProfilePatch = Omit<Profile, 'phoneVerified' | 'createdAt' | 'updatedAt'>

export function getProfile() {
  return request<Profile>('/auth/me/profile')
}

export function updateProfile(data: Partial<ProfilePatch>) {
  return patch<Profile>('/auth/me/profile', data)
}

// ── OIDC interaction (Authorization Server login + consent) ──────────────────
// These power the /interaction/:uid route the AS redirects third-party users to.
// They are cookie-based (the provider's _interaction cookie) — NOT first-party
// session calls — so they skip the 401→refresh retry; a 401 means bad
// credentials and should surface as an error.

export type InteractionDetails = {
  uid: string
  prompt: 'login' | 'consent'
  client: { clientId: string; name?: string; logoUri?: string }
  requestedScopes: string[]
  missingScopes: string[]
  missingClaims: string[]
}

export type InteractionLoginPayload =
  | { method: 'password'; username: string; password: string }
  | { method: 'passkey'; sessionId: string; credential: AuthenticationResponseJSON }
  | { method: 'telegram'; telegramData: TelegramAuthData }

export function getInteraction(uid: string) {
  return request<InteractionDetails>(`/interaction/${uid}`, { skipAuthRetry: true })
}

export function submitInteractionLogin(uid: string, payload: InteractionLoginPayload) {
  return post<{ redirectTo: string }>(`/interaction/${uid}/login`, payload, { skipAuthRetry: true })
}

export function submitInteractionConsent(uid: string) {
  return post<{ redirectTo: string }>(`/interaction/${uid}/consent`, {}, { skipAuthRetry: true })
}

export function submitInteractionDeny(uid: string) {
  return post<{ redirectTo: string }>(`/interaction/${uid}/deny`, {}, { skipAuthRetry: true })
}

// ── Connections (authorized third-party apps) ────────────────────────────────
// First-party, member self-service: the apps the member has granted access via
// the OIDC Authorization Server, and revocation thereof.

export type Connection = {
  clientId: string
  name: string
  logoUri: string | null
  scopes: string[]
  authorizedAt: number | null
}

export function getConnections() {
  return request<{ connections: Connection[] }>('/auth/me/connections')
}

export function revokeConnection(clientId: string) {
  return request<void>(`/auth/me/connections/${clientId}`, { method: 'DELETE' })
}

// ── Members ────────────────────────────────────────────────────────────────

export function getMembers() {
  return request<{ members: Member[] }>('/members')
}

// ── Admin ───────────────────────────────────────────────────────────────────
// Mirror of the access-token bridge: key lives in memory, set by the admin
// layout on unlock and cleared on lock. No context timing issues.

let adminApiKey: string | null = null

export function setAdminKey(key: string | null) {
  adminApiKey = key
}

function adminFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  return request<T>(path, {
    ...init,
    skipAuthRetry: true,
    headers: {
      ...(adminApiKey ? { Authorization: `ApiKey ${adminApiKey}` } : {}),
      ...init.headers,
    },
  })
}

export type OAuthClient = {
  id: string
  clientId: string
  name: string
  redirectUris: string[]
  allowedScopes: string[]
  isConfidential: boolean
  logoUri: string | null
  createdAt: string
  updatedAt: string
}

export type OAuthClientPayload = {
  name: string
  redirectUris: string[]
  allowedScopes: string[]
  clientId?: string
  logoUri?: string
}

export const SUPPORTED_SCOPES = [
  'openid',
  'profile',
  'email',
  'address',
  'phone',
  'membership',
  'offline_access',
] as const

export function adminApproveMember(id: string) {
  return adminFetch<{ member: Pick<Member, 'id' | 'username' | 'status'> }>(
    `/admin/members/${id}/approve`,
    { method: 'POST' },
  )
}

export function adminListClients() {
  return adminFetch<{ clients: OAuthClient[] }>('/admin/oauth-clients')
}

export function adminGetClient(id: string) {
  return adminFetch<{ client: OAuthClient }>(`/admin/oauth-clients/${id}`)
}

export function adminCreateClient(payload: OAuthClientPayload) {
  return adminFetch<{ client: OAuthClient }>('/admin/oauth-clients', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function adminUpdateClient(id: string, payload: Partial<OAuthClientPayload>) {
  return adminFetch<{ client: OAuthClient }>(`/admin/oauth-clients/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function adminDeleteClient(id: string) {
  return adminFetch<void>(`/admin/oauth-clients/${id}`, { method: 'DELETE' })
}

// ── Registration ───────────────────────────────────────────────────────────

type RegisterResult = { id: string; username: string; status: string }

export function passwordRegister(payload: {
  displayName: string
  username: string
  password: string
  backupEmail: string
}) {
  return post<RegisterResult>('/auth/register/password', payload)
}

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
  return post<PasskeyStartResult>('/auth/register/passkey/start', payload)
}

export type PasskeyFinishPayload = {
  sessionId: string
  credential: RegistrationResponseJSON
}

export function passkeyRegisterFinish(payload: PasskeyFinishPayload) {
  return post<RegisterResult>('/auth/register/passkey/finish', payload)
}

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
  return post<RegisterResult>('/auth/register/telegram', payload)
}
