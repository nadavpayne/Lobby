import { changeTerminalPin } from "@/lib/biz/profile";
import { isValidPin } from "@/lib/biz/validateProfile";
import { requireBusinessOwner } from "../requireBusinessOwner";

/** POST /api/biz/pin — { pin } sets a new 4-digit staff terminal PIN; all terminals sign in again. */
export async function POST(request: Request) {
  const auth = await requireBusinessOwner(request);
  if (auth instanceof Response) return auth;
  const pin = (await request.json().catch(() => null))?.pin;
  if (!isValidPin(pin)) return Response.json({ error: "קוד PIN חייב להיות 4 ספרות" }, { status: 400 });
  await changeTerminalPin(auth.db, auth.business.id, pin);
  return Response.json({ ok: true });
}
