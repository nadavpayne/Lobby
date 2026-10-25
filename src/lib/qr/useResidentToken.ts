"use client";

import { useCallback, useEffect, useState } from "react";
import { isApiError } from "@/lib/api/http";
import { fetchTokenStatus, issueToken } from "@/lib/api/resident";
import { secondsUntil } from "@/lib/time/countdown";
import type { IssuedToken, TokenStatus } from "./types";

// shortcut: polls while the QR is on screen; switch to a push/realtime event when the native app ships.
const POLL_MS = 2500;

export type ResidentTokenState =
  | { phase: "loading" }
  | { phase: "showing"; token: IssuedToken; secondsLeft: number }
  | { phase: "replaced" }
  | { phase: "done"; done: Extract<TokenStatus, { status: "used" }> }
  | { phase: "error"; error: string };

/**
 * The resident's QR for one business: issues a token, counts its 5 minutes down, issues a fresh one automatically when
 * it runs out (the old one is dead server-side), and polls until the register approves it (→ "done").
 */
export function useResidentToken(authToken: string, businessId: string, onRedeemed: () => void): { state: ResidentTokenState; renew: () => void } {
  const [state, setState] = useState<ResidentTokenState>({ phase: "loading" });

  const renew = useCallback(async () => {
    setState({ phase: "loading" });
    const res = await issueToken(authToken, businessId);
    if (isApiError(res)) setState({ phase: "error", error: res.error });
    else setState({ phase: "showing", token: res, secondsLeft: secondsUntil(res.expiresAt) });
  }, [authToken, businessId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- issue on open; state changes after the request returns
  useEffect(() => void renew(), [renew]);

  const tokenId = state.phase === "showing" ? state.token.tokenId : null;
  const expiresAt = state.phase === "showing" ? state.token.expiresAt : null;

  // Countdown; at 0:00 the code is dead, so get a fresh one.
  useEffect(() => {
    if (!expiresAt) return;
    const id = setInterval(() => {
      const left = secondsUntil(expiresAt);
      if (left === 0) renew();
      else setState((s) => (s.phase === "showing" ? { ...s, secondsLeft: left } : s));
    }, 1000);
    return () => clearInterval(id);
  }, [expiresAt, renew]);

  // Has the register approved it? (Or did another phone in the apartment take over?)
  useEffect(() => {
    if (!tokenId) return;
    const id = setInterval(async () => {
      const res = await fetchTokenStatus(authToken, tokenId);
      if (isApiError(res)) return;
      if (res.status === "used") {
        setState({ phase: "done", done: res });
        onRedeemed();
      } else if (res.status === "replaced") {
        setState({ phase: "replaced" });
      }
    }, POLL_MS);
    return () => clearInterval(id);
  }, [authToken, tokenId, onRedeemed]);

  return { state, renew };
}
