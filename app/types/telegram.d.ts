import type { TelegramAuthData } from '../libs/api'

declare global {
  interface Window {
    Telegram?: {
      Login: {
        auth: (
          options: { bot_id: string | number; request_access?: boolean },
          callback: (data: TelegramAuthData | false) => void,
        ) => void
      }
    }
  }
}
