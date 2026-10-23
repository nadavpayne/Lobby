// Single place that knows where the API lives. Today it's same-origin; a native app that bundles its
// own assets would prefix the deployed URL here.
const API_BASE = "";

export type ApiError = { error: string; unauthorized?: boolean };

/** JSON request to our API with an optional bearer token. Never throws: failures come back as { error }. */
export async function apiFetch<T>(path: string, options: { token?: string; body?: unknown } = {}): Promise<T | ApiError> {
  const { token, body } = options;
  try {
    const res = await fetch(API_BASE + path, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        ...(body !== undefined && { "Content-Type": "application/json" }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok) return json as T;
    return { error: json.error ?? "משהו השתבש. נסו שוב בעוד רגע.", unauthorized: res.status === 401, ...json };
  } catch {
    return { error: "אין חיבור לאינטרנט. בדקו את החיבור ונסו שוב." };
  }
}

/** Type guard for apiFetch failures. */
export const isApiError = (value: unknown): value is ApiError =>
  typeof value === "object" && value !== null && "error" in value;
