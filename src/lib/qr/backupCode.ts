// Backup codes: 6 characters from an alphabet without look-alikes (no 0/O, 1/I/L, nor B/8, S/5, Z/2, G/6...),
// shown as XXX-XXX. Same alphabet as the DB check on redemption_tokens.backup_code.
export const BACKUP_ALPHABET = "ACEFHJKMNPRTWXY3479";

/** A random backup code (crypto-random, no modulo bias), stored without the dash. */
export function generateBackupCode(): string {
  const limit = 256 - (256 % BACKUP_ALPHABET.length); // drop the uneven tail of a byte's range
  let code = "";
  while (code.length < 6) {
    const [byte] = crypto.getRandomValues(new Uint8Array(1));
    if (byte < limit) code += BACKUP_ALPHABET[byte % BACKUP_ALPHABET.length];
  }
  return code;
}

/** Typed input → stored form: uppercase, without dashes/spaces; null if it can't be a backup code. */
export function normalizeBackupCode(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const code = input.toUpperCase().replace(/[\s-]/g, "");
  return code.length === 6 && [...code].every((c) => BACKUP_ALPHABET.includes(c)) ? code : null;
}

/** "HAPPY7" → "HAP-PY7". */
export const formatBackupCode = (code: string) => `${code.slice(0, 3)}-${code.slice(3)}`;
