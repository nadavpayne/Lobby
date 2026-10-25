"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { isApiError } from "@/lib/api/http";
import { requestCode } from "@/lib/api/resident";
import type { IssuedCode, ResidentOffer } from "@/lib/offers/types";
import { shortDate } from "@/components/resident/OfferTags";
import { CodeView } from "../../CodeView";

interface Props {
  offer: ResidentOffer;
  token: string;
  /** Refreshes the feed after a code is issued, so every screen shows "קוד פעיל". */
  onIssued: () => void;
}

/** This month's status for my apartment and the main action, pinned above the tab bar. */
export function RedeemBar({ offer: o, token, onIssued }: Props) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shown, setShown] = useState<IssuedCode | null>(null);

  /** Gets a new code (or the live one) and shows it full screen. */
  async function redeem() {
    setPending(true);
    const res = await requestCode(token, o.businessId);
    setPending(false);
    if (isApiError(res)) return setError(res.error);
    setError(null);
    setShown(res);
    onIssued();
  }

  const status = {
    available: "ההטבה זמינה לדירה שלכם החודש",
    active: "יש לכם קוד פעיל. הציגו אותו בקופה",
    used: `מימשתם החודש · ההטבה מתחדשת ב-${o.renewsOn ? shortDate(o.renewsOn) : "1 לחודש"}`,
    sold_out: "ההטבה אזלה בבניין החודש",
    upcoming: `ההטבה תיפתח ב-${o.startsAt ? shortDate(o.startsAt) : "קרוב"}`,
  }[o.state];

  return (
    <div className="sticky bottom-[calc(5rem+env(safe-area-inset-bottom))] z-10 flex flex-col gap-2 rounded-3xl bg-white p-4 shadow-lift">
      <p className="text-center font-medium">{status}</p>
      {error && <p role="alert" className="text-center text-sm text-red-700">{error}</p>}
      {o.state === "available" && <Button onClick={redeem} disabled={pending}>{pending ? "מכינים קוד…" : "השתמש בהטבה"}</Button>}
      {o.state === "active" && o.activeCode && <Button variant="navy" onClick={() => setShown(o.activeCode!)}>הצגת הקוד</Button>}
      {shown && <CodeView code={shown} onClose={() => setShown(null)} />}
    </div>
  );
}
