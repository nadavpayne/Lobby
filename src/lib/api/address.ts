import type { AddressSuggestion, ResolvedAddress } from "@/lib/address/types";
import { apiFetch } from "./http";

/** Address suggestions for what the user typed (one session token per address being picked). */
export const fetchSuggestions = (q: string, session: string) =>
  apiFetch<{ suggestions: AddressSuggestion[] }>("/api/address/autocomplete", { body: { q, session } });

/** The picked suggestion's full address, plus why it can't be used (null when fine). */
export const resolveSuggestion = (placeId: string, session: string) =>
  apiFetch<{ address: ResolvedAddress; problem: string | null }>("/api/address/resolve", { body: { placeId, session } });
