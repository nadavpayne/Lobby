// Redemption codes: 6 digits, valid 10 minutes, unique among a business's live codes (see the DB index).
// The QR on the resident's screen encodes the bare code.

/** Keeps only the digits of typed or scanned input ("123 456", "123-456" → "123456"). */
export function normalizeCode(input: unknown): string {
  return typeof input === "string" ? input.replace(/\D/g, "") : "";
}

/** True if the (normalized) code has a valid shape: exactly 6 digits. */
export function isValidCode(code: string): boolean {
  return /^\d{6}$/.test(code);
}

// Largest multiple of 1,000,000 below 2^32: values at or above it are redrawn so every code is equally likely.
const LIMIT = 4_294_000_000;

/** A new random 6-digit code (crypto-random, no modulo bias), leading zeros kept. */
export function generateCode(): string {
  let n: number;
  do [n] = crypto.getRandomValues(new Uint32Array(1));
  while (n >= LIMIT);
  return String(n % 1_000_000).padStart(6, "0");
}
