export type TelegramLogin = NonNullable<Window['Telegram']>['Login']

export function loadTelegramWidget(): Promise<TelegramLogin> {
  return new Promise((resolve, reject) => {
    if (window.Telegram?.Login) { resolve(window.Telegram.Login); return }
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
