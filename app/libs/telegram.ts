import type { TelegramAuthData } from './api'

export type TelegramLogin = NonNullable<Window['Telegram']>['Login']

export function decodeTgAuthResult(encoded: string): TelegramAuthData | false {
  let padded = encoded.replace(/-/g, '+').replace(/_/g, '/')
  const rem = padded.length % 4
  if (rem > 1) padded += '='.repeat(4 - rem)
  try {
    return JSON.parse(window.atob(padded)) as TelegramAuthData
  } catch {
    return false
  }
}

export async function requestTelegramAuth(): Promise<TelegramAuthData | null> {
  const tgLogin = await loadTelegramWidget()
  return new Promise((resolve) => {
    tgLogin.auth({ bot_id: import.meta.env.VITE_TELEGRAM_BOT_ID, request_access: true }, (data) =>
      resolve(data || null),
    )
  })
}

export function loadTelegramWidget(): Promise<TelegramLogin> {
  return new Promise((resolve, reject) => {
    if (window.Telegram?.Login) {
      resolve(window.Telegram.Login)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.async = true
    script.onload = () =>
      window.Telegram?.Login
        ? resolve(window.Telegram.Login)
        : reject(new Error('Telegram widget failed to load'))
    script.onerror = () => reject(new Error('Telegram widget failed to load'))
    document.head.appendChild(script)
  })
}
