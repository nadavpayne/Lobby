// Remembers the terminal's device token per access link. localStorage can be unavailable
// (private mode, blocked storage), so every access is guarded and failure just means "ask for the PIN".

const key = (slug: string) => `lobby.terminal.${slug}`;

/** Saved device token for this access link, if any. */
export function loadToken(slug: string): string | null {
  try {
    return localStorage.getItem(key(slug));
  } catch {
    return null;
  }
}

/** Saves the device token so the PIN is asked only once per device. */
export function saveToken(slug: string, token: string): void {
  try {
    localStorage.setItem(key(slug), token);
  } catch {}
}

/** Forgets the device token (logout, or token no longer valid). */
export function clearToken(slug: string): void {
  try {
    localStorage.removeItem(key(slug));
  } catch {}
}
