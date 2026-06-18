import { isValidEmail } from './email'

export const isValidUsername = (username: string) => isValidEmail(`${username}@example.com`)

export const deriveUsername = (displayName: string): string =>
  displayName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '.')
    .replace(/[^a-z0-9._-]/g, '')
    .replace(/\.{2,}/g, '.')
    .replace(/^[._-]+|[._-]+$/g, '')
    .slice(0, 64)
