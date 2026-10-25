import { createHmac, timingSafeEqual } from "node:crypto";

// What the QR holds: "LBY1.<token id>.<expiry, unix seconds>.<signature>". Only the token id and expiry, no personal
// data; the server looks everything else up. The signature stops anyone from inventing or editing a QR.
const PREFIX = "LBY1";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** HMAC over the token id and expiry (domain-separated from the business terminal tokens that share the secret). */
function signature(tokenId: string, expUnix: number, secret: string): string {
  return createHmac("sha256", secret).update(`qr|${tokenId}|${expUnix}`).digest("base64url").slice(0, 22);
}

/** The QR payload for a token. */
export function signQr(tokenId: string, expiresAt: Date, secret: string): string {
  const exp = Math.floor(expiresAt.getTime() / 1000);
  return `${PREFIX}.${tokenId}.${exp}.${signature(tokenId, exp, secret)}`;
}

/** The token id inside a QR payload, or null if it isn't ours or the signature doesn't match. Expiry is the server's call. */
export function readQr(payload: unknown, secret: string): string | null {
  if (typeof payload !== "string") return null;
  const [prefix, tokenId, expText, sig, ...rest] = payload.trim().split(".");
  if (prefix !== PREFIX || rest.length || !UUID.test(tokenId ?? "") || !/^\d{1,12}$/.test(expText ?? "") || !sig) return null;
  const expected = Buffer.from(signature(tokenId, Number(expText), secret));
  const given = Buffer.from(sig);
  return given.length === expected.length && timingSafeEqual(given, expected) ? tokenId : null;
}

/** True if a scanned value looks like one of our QRs (vs. a typed backup code). */
export const isQrPayload = (value: string) => value.trim().startsWith(`${PREFIX}.`);
