// Redemption codes: 6 chars from the unambiguous alphabet ABCDEFGHJKMNPQRSTUVWXYZ23456789 (no 0/O, 1/I/L).
// The QR on the resident's screen encodes the bare code.

/** Uppercases typed or scanned input and drops spaces, dashes and anything else non-alphanumeric. */
export function normalizeCode(input: unknown): string {
  return typeof input === "string" ? input.toUpperCase().replace(/[^A-Z0-9]/g, "") : "";
}

/** True if the (normalized) code has a valid shape. Same rule as the DB check constraint. */
export function isValidCode(code: string): boolean {
  return /^[A-HJKMNP-Z2-9]{6}$/.test(code);
}

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** A new random 6-char code from the unambiguous alphabet (crypto-random, no modulo bias). */
export function generateCode(): string {
  let code = "";
  while (code.length < 6) {
    const [byte] = crypto.getRandomValues(new Uint8Array(1));
    if (byte < 248) code += ALPHABET[byte % ALPHABET.length]; // 248 = 8 × 31: drop the uneven tail
  }
  return code;
}
