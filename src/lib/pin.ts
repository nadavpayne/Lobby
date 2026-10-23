import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

// A 4-digit PIN has only 10k values, so the hash can't stop offline brute force; the real protection
// is the secret access_slug plus per-business rate limiting on PIN attempts.

/** Hashes a PIN as "scrypt$<salt>$<hash>" (base64). */
export function hashPin(pin: string): string {
  const salt = randomBytes(16);
  return `scrypt$${salt.toString("base64")}$${scryptSync(pin, salt, 32).toString("base64")}`;
}

/** Checks a PIN against a stored hashPin() value in constant time. */
export function verifyPin(pin: string, stored: string): boolean {
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64");
  return timingSafeEqual(scryptSync(pin, Buffer.from(salt, "base64"), expected.length), expected);
}
