/** Whole seconds from now until an ISO time, never below zero. */
export function secondsUntil(iso: string, now = Date.now()): number {
  return Math.max(0, Math.ceil((Date.parse(iso) - now) / 1000));
}

/** "9:05" style minutes:seconds. */
export function formatCountdown(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

/** "246824" → "246 824", easier to read out at the register. */
export const spacedCode = (code: string) => code.replace(/^(\d{3})(\d{3})$/, "$1 $2");
