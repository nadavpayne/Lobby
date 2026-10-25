"use client";

import { useState } from "react";
import { shortDate } from "@/components/resident/OfferTags";
import { Button } from "@/components/ui";
import type { ResidentOffer } from "@/lib/offers/types";
import { QrSheet } from "../../qr/QrSheet";

interface Props {
  offer: ResidentOffer;
  token: string;
  /** "רוטשילד 45, פתח תקווה" for the QR screen's footer. */
  address: string;
  /** Refreshes the feed after the register approves it, so every screen shows "used". */
  onRedeemed: () => void;
}

/** This month's status for my apartment and "use benefit", pinned above the tab bar; opens the QR sheet. */
export function RedeemBar({ offer: o, token, address, onRedeemed }: Props) {
  const [open, setOpen] = useState(false);

  const status = {
    available: "ההטבה זמינה לדירה שלכם החודש",
    active: "יש לכם קוד פתוח. הציגו אותו בקופה",
    used: `מימשתם החודש · ההטבה מתחדשת ב-${o.renewsOn ? shortDate(o.renewsOn) : "1 לחודש"}`,
    sold_out: "ההטבה אזלה בבניין החודש",
    upcoming: `ההטבה תיפתח ב-${o.startsAt ? shortDate(o.startsAt) : "קרוב"}`,
  }[o.state];

  return (
    <div className="sticky bottom-[calc(5rem+env(safe-area-inset-bottom))] z-10 flex flex-col gap-2 rounded-3xl bg-white p-4 shadow-lift">
      <p className="text-center font-medium">{status}</p>
      {(o.state === "available" || o.state === "active") && (
        <Button variant={o.state === "active" ? "navy" : "primary"} onClick={() => setOpen(true)}>
          {o.state === "active" ? "הצגת הקוד" : "השתמש בהטבה"}
        </Button>
      )}
      {open && (
        <QrSheet
          authToken={token}
          businessId={o.businessId}
          businessName={o.businessName}
          discountPercent={o.discountPercent}
          address={address}
          onClose={() => setOpen(false)}
          onRedeemed={onRedeemed}
        />
      )}
    </div>
  );
}
