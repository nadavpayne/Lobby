import type { JoinErrors } from "@/lib/businesses/validateJoin";
import type { ApiError } from "./http";

export type JoinResponse = { loginUrl: string } | ({ errors: JoinErrors & { logo?: string } } & ApiError) | ApiError;

/** Submits the onboarding form with the business's logo to POST /api/businesses (multipart: "data" JSON + "logo"). Never throws. */
export async function submitJoin(input: Record<string, unknown>, logo: Blob): Promise<JoinResponse> {
  const form = new FormData();
  form.append("data", JSON.stringify(input));
  form.append("logo", logo, "logo.jpg");
  try {
    const res = await fetch("/api/businesses", { method: "POST", body: form });
    const json = await res.json().catch(() => ({}));
    if (res.ok) return json;
    return { error: json.error ?? "יש שדות שצריך לתקן", ...json };
  } catch {
    return { error: "אין חיבור לאינטרנט. בדקו את החיבור ונסו שוב." };
  }
}
