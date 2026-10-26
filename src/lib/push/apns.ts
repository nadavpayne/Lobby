import "server-only";
import { createPrivateKey, sign } from "node:crypto";
import { connect } from "node:http2";

// Apple Push Notification service over HTTP/2 with a token (.p8) key.
// Env: APNS_KEY_ID, APNS_TEAM_ID, APNS_PRIVATE_KEY (the .p8 contents), APNS_BUNDLE_ID, APNS_SANDBOX ("true" for dev builds).

export interface PushMessage {
  title: string;
  body: string;
  /** In-app path the tap opens, e.g. "/app/wallet". */
  url: string;
}

/** Push is configured on this server. */
export const apnsConfigured = () => !!(process.env.APNS_KEY_ID && process.env.APNS_TEAM_ID && process.env.APNS_PRIVATE_KEY && process.env.APNS_BUNDLE_ID);

const b64url = (data: string | Buffer) => Buffer.from(data).toString("base64url");
let cached: { jwt: string; at: number } | null = null;

/** The provider token (an ES256 JWT), reused for 50 minutes (Apple accepts it for up to an hour). */
function providerToken(): string {
  if (cached && Date.now() - cached.at < 50 * 60 * 1000) return cached.jwt;
  const header = b64url(JSON.stringify({ alg: "ES256", kid: process.env.APNS_KEY_ID }));
  const claims = b64url(JSON.stringify({ iss: process.env.APNS_TEAM_ID, iat: Math.floor(Date.now() / 1000) }));
  const key = createPrivateKey(process.env.APNS_PRIVATE_KEY!.replace(/\\n/g, "\n"));
  const signature = sign("sha256", Buffer.from(`${header}.${claims}`), { key, dsaEncoding: "ieee-p1363" });
  cached = { jwt: `${header}.${claims}.${b64url(signature)}`, at: Date.now() };
  return cached.jwt;
}

/** Sends one message to several device tokens; returns the tokens Apple says are dead (to delete). */
export async function sendApns(tokens: string[], message: PushMessage): Promise<string[]> {
  if (!apnsConfigured() || tokens.length === 0) return [];
  const host = process.env.APNS_SANDBOX === "true" ? "https://api.sandbox.push.apple.com" : "https://api.push.apple.com";
  const payload = JSON.stringify({ aps: { alert: { title: message.title, body: message.body }, sound: "default" }, url: message.url });
  const client = connect(host);
  const dead: string[] = [];
  try {
    await Promise.all(tokens.map((token) => new Promise<void>((resolve) => {
      const req = client.request({
        ":method": "POST", ":path": `/3/device/${token}`, authorization: `bearer ${providerToken()}`,
        "apns-topic": process.env.APNS_BUNDLE_ID!, "apns-push-type": "alert", "content-type": "application/json",
      });
      req.on("response", (h) => {
        const status = Number(h[":status"]);
        if (status === 410 || status === 400) dead.push(token); // unregistered / bad token: forget it
      });
      req.on("error", () => resolve());
      req.on("close", () => resolve());
      req.end(payload);
    })));
  } finally {
    client.close();
  }
  return dead;
}
