"use client";

import { useEffect, useState } from "react";
import { secondaryButton } from "@/components/ui";
import { isApiError, type ApiError } from "@/lib/api/http";
import { fetchBusiness } from "@/lib/api/terminal";
import { clearToken, loadToken, saveToken } from "@/lib/businesses/tokenStore";
import type { BusinessInfo } from "@/lib/businesses/types";
import { CodeTerminal } from "./CodeTerminal";
import { PinForm } from "./PinForm";

export type Session = { token: string } & BusinessInfo;

/** Restores the saved session for this link: a Session, null (needs PIN) or a network error. */
async function restoreSession(slug: string): Promise<Session | null | ApiError> {
  const token = loadToken(slug);
  if (!token) return null;
  const res = await fetchBusiness(token);
  if (!isApiError(res)) return { token, ...res };
  if (!res.unauthorized) return res;
  clearToken(slug);
  return null;
}

/** Terminal entry point: PIN once per device, then the code terminal. */
export function BusinessTerminal({ slug }: { slug: string }) {
  const [session, setSession] = useState<Session | null>(); // undefined while loading
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let live = true;
    restoreSession(slug).then((res) => {
      if (!live) return;
      if (isApiError(res)) setLoadError(res.error);
      else setSession(res);
    });
    return () => {
      live = false;
    };
  }, [slug, attempt]);

  /** Drops the device token and returns to the PIN screen. */
  function logout() {
    clearToken(slug);
    setSession(null);
  }

  if (loadError) {
    return (
      <div className="flex flex-col gap-4 pt-10 text-center">
        <p role="alert" className="text-lg">{loadError}</p>
        <button type="button" className={secondaryButton} onClick={() => { setLoadError(null); setAttempt((n) => n + 1); }}>
          נסו שוב
        </button>
      </div>
    );
  }
  if (session === undefined) return <p className="pt-10 text-center text-lg text-navy/70">טוען…</p>;
  if (!session) {
    return (
      <PinForm
        slug={slug}
        onLogin={(token, business) => {
          saveToken(slug, token);
          setSession({ token, ...business });
        }}
      />
    );
  }
  return <CodeTerminal session={session} onLogout={logout} />;
}
