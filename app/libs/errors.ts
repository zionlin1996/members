export const errorMessage = (err: unknown, fallback = 'Something went wrong.') =>
  err instanceof Error ? err.message : fallback

export const isPasskeyCancelled = (err: unknown) =>
  err instanceof Error && err.name === 'NotAllowedError'
