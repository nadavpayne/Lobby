"use client";

import { Ban, ChevronRight, Clock, Info, Store, XCircle } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui";
import { clock, monthOfPeriod, receiptTime, unlockDay } from "@/lib/qr/labels";
import { formatAgorot } from "@/lib/qr/money";
import type { PreviousRedemption } from "@/lib/qr/types";
import { currentPeriod } from "@/lib/period";

/** Every reason a scan or approve can't give a discount, with what the screen needs. */
export type RegisterError =
  | { code: "CODE_EXPIRED"; issuedAt: string | null; expiresAt: string | null }
  | { code: "ALREADY_REDEEMED_THIS_MONTH"; apartmentNumber: string | null; previous: PreviousRedemption | null; renewsOn: string }
  | { code: "ALREADY_REDEEMED_ONE_TIME"; apartmentNumber: string | null; previous: PreviousRedemption | null }
  | { code: "CODE_ALREADY_USED"; usedAt: string | null }
  | { code: "INVALID_CODE" | "WRONG_BUSINESS" | "INVALID_AMOUNT" };

const money = (agorot: number) => <bdi dir="ltr">{formatAgorot(agorot)}</bdi>;

/** One label/value line in the details card. */
function Row({ label, children, strong }: { label: string; children: ReactNode; strong?: boolean }) {
  return <div className="flex justify-between"><span className="text-muted">{label}</span><span dir="ltr" className={strong ? "font-bold" : ""}>{children}</span></div>;
}

interface Props {
  error: RegisterError;
  businessName: string;
  station: string;
  onNext: () => void;
}

/** The "no discount" screens: expired (Expired.dc), already redeemed this month (Used.dc), reused / invalid / other business. */
export function ScanErrorScreen({ error: e, businessName, station, onNext }: Props) {
  // "Used" layout (navy, ban icon) for redemption-related refusals; "Expired" layout (amber) for dead or bad codes.
  const redeemed = e.code === "ALREADY_REDEEMED_THIS_MONTH" || e.code === "ALREADY_REDEEMED_ONE_TIME";
  const used = redeemed || e.code === "CODE_ALREADY_USED";
  const apartment = redeemed && e.apartmentNumber ? `דירה ${e.apartmentNumber}` : "הדירה";
  const icon = e.code === "CODE_EXPIRED" ? <Clock /> : e.code === "WRONG_BUSINESS" ? <Store /> : used ? <Ban /> : <XCircle />;
  const content = {
    CODE_EXPIRED: ["הקוד פג תוקף", "קוד הטבה תקף ל-5 דקות. בקשו מהדייר לפתוח את ההטבה מחדש באפליקציה, ויופיע קוד חדש."],
    ALREADY_REDEEMED_THIS_MONTH: [
      "ההטבה כבר מומשה החודש",
      `${apartment} כבר קיבלה הנחה אצלכם ב${monthOfPeriod(currentPeriod())}. ההטבה הבאה תהיה זמינה מ-${e.code === "ALREADY_REDEEMED_THIS_MONTH" ? unlockDay(e.renewsOn) : ""}.`,
    ],
    ALREADY_REDEEMED_ONE_TIME: ["ההטבה כבר נוצלה", `${apartment} כבר קיבלה את ההטבה החד־פעמית אצלכם. ההטבה ניתנת פעם אחת בלבד.`],
    CODE_ALREADY_USED: ["הקוד כבר מומש", `הקוד הזה כבר שימש למימוש${e.code === "CODE_ALREADY_USED" && e.usedAt ? ` ב-${clock(e.usedAt)}` : ""}. כל קוד תקף פעם אחת בלבד.`],
    INVALID_CODE: ["הקוד לא תקין", "הקוד לא נמצא אצל Lobby. בדקו שהוקלד נכון, או בקשו מהדייר לפתוח את ההטבה מחדש באפליקציה."],
    WRONG_BUSINESS: ["הקוד שייך לעסק אחר", "הקוד הזה הונפק להטבה בעסק אחר, ולא אפשר לממש אותו כאן."],
    INVALID_AMOUNT: ["סכום לא תקין", "הקלידו את סכום החשבון לפני ההנחה וסרקו שוב."],
  }[e.code];
  const note =
    redeemed ? "אין לתת הנחה על הקנייה הזו. הלקוח יכול לשלם במחיר הרגיל."
    : e.code === "CODE_ALREADY_USED" ? "לא נרשם מימוש נוסף. אין לתת הנחה שוב."
    : "לא נרשם מימוש. אין לתת הנחה על הקוד הזה.";

  return (
    <div role="alert" className="flex min-h-[calc(100dvh-8rem)] flex-col gap-5 md:min-h-[680px]">
      <header className="flex items-center gap-3">
        <button type="button" onClick={onNext} aria-label="חזרה לסריקה" className="grid size-11 place-items-center rounded-xl border border-hairline bg-white">
          <ChevronRight aria-hidden className="size-5" />
        </button>
        <h1 className="text-lg font-bold">תוצאת סריקה</h1>
        <span className="ms-auto truncate text-sm text-muted">{businessName} · {station}</span>
      </header>

      <div className="flex flex-col items-center gap-3.5 pt-8 text-center">
        <span aria-hidden className={`grid size-24 place-items-center rounded-full [&>svg]:size-12 ${used ? "bg-navy text-white" : "bg-highlight text-navy"}`}>{icon}</span>
        <h2 className="mt-3 text-[1.75rem] leading-9 font-extrabold">{content[0]}</h2>
        <p className="max-w-[300px] text-[0.9375rem] leading-[1.375rem] text-muted">{content[1]}</p>
      </div>

      <section className="flex flex-col gap-2.5 rounded-[20px] bg-white p-4 text-sm">
        {e.code === "CODE_EXPIRED" && e.issuedAt && e.expiresAt && (
          <>
            <Row label="הקוד נוצר">{clock(e.issuedAt)}</Row>
            <Row label="פג תוקף" strong>{clock(e.expiresAt)}</Row>
            <div className="h-px bg-hairline" />
          </>
        )}
        {redeemed && e.previous && (
          <>
            <p className="text-[0.8125rem] font-semibold">המימוש הקודם</p>
            <Row label="תאריך">{receiptTime(e.previous.redeemedAt)}</Row>
            <Row label="סכום החשבון">{money(e.previous.billAgorot)}</Row>
            <Row label="הנחה שניתנה" strong>{money(e.previous.discountAgorot)}</Row>
            <div className="h-px bg-hairline" />
          </>
        )}
        <p className="flex items-start gap-2"><Info aria-hidden className="mt-0.5 size-[18px] shrink-0" /> {note}</p>
      </section>

      <Button variant="navy" onClick={onNext} className="mt-auto" autoFocus>{e.code === "CODE_EXPIRED" ? "סריקה מחדש" : "סריקה הבאה"}</Button>
    </div>
  );
}
