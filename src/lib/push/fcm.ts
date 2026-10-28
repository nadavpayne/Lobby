import "server-only";
import { createPrivateKey, sign } from "node:crypto";
import type { PushMessage } from "./apns";
import { fcmMessage, isDeadToken } from "./fcmMessage";

// Android push through Firebase Cloud Messaging (HTTP v1 API).
// Env: FCM_SERVICE_ACCOUNT, the whole JSON of a Firebase service account key (project_id, client_email, private_key).

interface ServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
}

/** The service account from the env, or null when Android push isn't set up. */
function serviceAccount(): ServiceAccount | null {
  try {
    const account = JSON.parse(process.env.FCM_SERVICE_ACCOUNT ?? "") as Partial<ServiceAccount>;
    return account.project_id && account.client_email && account.private_key ? (account as ServiceAccount) : null;
  } catch {
    return null;
  }
}

/** Android push is configured on this server. */
export const fcmConfigured = () => serviceAccount() !== null;

const b64url = (data: string | Buffer) => Buffer.from(data).toString("base64url");
let cached: { token: string; at: number } | null = null;

/** A Google OAuth access token for FCM (from a signed RS256 JWT), reused for 50 minutes; Google issues it for an hour. */
async function accessToken(account: ServiceAccount): Promise<string> {
  if (cached && Date.now() - cached.at < 50 * 60 * 1000) return cached.token;
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(JSON.stringify({
    iss: account.client_email, scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600,
  }));
  const key = createPrivateKey(account.private_key.replace(/\\n/g, "\n"));
  const jwt = `${header}.${claims}.${b64url(sign("sha256", Buffer.from(`${header}.${claims}`), key))}`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
  });
  if (!res.ok) throw new Error(`FCM auth failed: ${res.status}`);
  cached = { token: ((await res.json()) as { access_token: string }).access_token, at: Date.now() };
  return cached.token;
}

/** Sends one message to several Android device tokens; returns the tokens FCM says are dead (to delete). */
export async function sendFcm(tokens: string[], message: PushMessage): Promise<string[]> {
  const account = serviceAccount();
  if (!account || tokens.length === 0) return [];
  const auth = await accessToken(account);
  const url = `https://fcm.googleapis.com/v1/projects/${account.project_id}/messages:send`;
  const dead: string[] = [];
  await Promise.all(tokens.map(async (token) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { authorization: `Bearer ${auth}`, "content-type": "application/json" },
      body: JSON.stringify(fcmMessage(token, message)),
    }).catch(() => null);
    if (res && !res.ok && isDeadToken(res.status, await res.text())) dead.push(token);
  }));
  return dead;
}
