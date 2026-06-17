const USERNAME_RE = /^[a-z0-9]+([._-][a-z0-9]+)*$/;

export function isValidUsername(username: string): boolean {
  return USERNAME_RE.test(username);
}

export function deriveUsername(displayName: string): string {
  return displayName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ".")
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/\.{2,}/g, ".")
    .replace(/^[._-]+|[._-]+$/g, "")
    .slice(0, 64);
}
