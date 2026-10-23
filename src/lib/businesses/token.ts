import { createHmac, timingSafeEqual } from "node:crypto";

// Device token for a business terminal, sent as "Authorization: Bearer <token>" (works the same in a
// browser and in the future native app; no cookies). Format: base64url(JSON {bid, exp}).signature.
// The signature covers the business's current pin_hash, so changing the PIN logs out every device.

const TTL_MS = 180 * 24 * 60 * 60 * 1000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** HMAC of the payload bound to the business's PIN hash. */
const sign = (payload: string, pinHash: string, secret: string) =>
  createHmac("sha256", secret).update(`${payload}.${pinHash}`).digest("base64url");

/** Creates a device token valid for 180 days. */
export function createBusinessToken(businessId: string, pinHash: string, secret: string, now = Date.now()): string {
  const payload = Buffer.from(JSON.stringify({ bid: businessId, exp: now + TTL_MS })).toString("base64url");
  return `${payload}.${sign(payload, pinHash, secret)}`;
}

/** Business id from an unexpired token, before the signature is checked (needed to load the PIN hash). */
export function readBusinessId(token: string, now = Date.now()): string | null {
  try {
    const { bid, exp } = JSON.parse(Buffer.from(token.split(".")[0], "base64url").toString());
    return typeof bid === "string" && UUID.test(bid) && typeof exp === "number" && exp > now ? bid : null;
  } catch {
    return null;
  }
}

/** True if the token's signature matches the business's current PIN hash. */
export function isBusinessTokenValid(token: string, pinHash: string, secret: string): boolean {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  const expected = Buffer.from(sign(payload, pinHash, secret));
  const actual = Buffer.from(signature);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
