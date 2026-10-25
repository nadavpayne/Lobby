"use client";

import { CalendarCheck, PiggyBank, Ticket } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { buttonClass, EmptyState, SkeletonCard, StatTile, Tag, type Tint } from "@/components/ui";
import { isApiError } from "@/lib/api/http";
import { fetchCodeHistory } from "@/lib/api/resident";
import type { CodeHistory, CodeHistoryItem } from "@/lib/offers/types";
import { formatShekels } from "@/lib/redemptions/money";
import { useResident } from "../ResidentGate";

const date = new Intl.DateTimeFormat("he-IL", { timeZone: "Asia/Jerusalem", day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" });

const STATUS: Record<CodeHistoryItem["status"], [string, Tint]> = {
  redeemed: ["מומש", "mint"],
  voided: ["בוטל על ידי העסק", "white"],
};

/** "הארנק שלי": what the apartment saved (total and this month) and every benefit it used. */
export default function WalletScreen() {
  const { token } = useResident();
  const [history, setHistory] = useState<CodeHistory>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    fetchCodeHistory(token).then((res) => {
      if (!live) return;
      setError(isApiError(res) ? res.error : null);
      if (!isApiError(res)) setHistory(res);
    });
    return () => {
      live = false;
    };
  }, [token]);

  const redeemedCount = history?.items.filter((i) => i.status === "redeemed").length ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">הארנק שלי</h1>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}
      {!history && !error && <SkeletonCard />}

      {history && (
        <>
          <StatTile tint="navy" icon={<PiggyBank />} label="חסכתם מאז שהצטרפתם" value={<bdi dir="ltr">{formatShekels(history.savedTotal)}</bdi>} />
          <div className="grid grid-cols-2 gap-3">
            <StatTile tint="mint" icon={<CalendarCheck />} label="החודש" value={<bdi dir="ltr">{formatShekels(history.savedThisMonth)}</bdi>} />
            <StatTile tint="peach" icon={<Ticket />} label="הטבות שמימשתם" value={redeemedCount} />
          </div>
          <p className="text-sm text-navy/70">החיסכון והקודים משותפים לכל החשבונות בדירה.</p>

          {history.items.length === 0 ? (
            <EmptyState icon={<Ticket />} title="עוד אין מימושים" action={<Link href="/app" className={buttonClass("primary", "md")}>להטבות בבניין</Link>}>
              ברגע שתשתמשו בהטבה הראשונה, היא תופיע כאן יחד עם כמה חסכתם.
            </EmptyState>
          ) : (
            <ul className="flex flex-col gap-3">
              {history.items.map((item) => {
                const [label, tint] = STATUS[item.status];
                return (
                  <li key={item.code + item.redeemedAt} className={`flex flex-col gap-1 rounded-3xl bg-white p-4 shadow-soft ${item.status === "voided" ? "opacity-60" : ""}`}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-lg font-bold">{item.businessName}</p>
                      <Tag tint={tint}>{label}</Tag>
                    </div>
                    <p className="text-sm text-muted"><bdi dir="ltr">{date.format(new Date(item.redeemedAt))}</bdi></p>
                    <p>
                      {item.status === "voided" ? "חשבון של " : "חסכתם "}
                      {item.status === "redeemed" && <><bdi dir="ltr" className="font-bold">{formatShekels(item.discountAmount)}</bdi> מתוך </>}
                      <bdi dir="ltr">{formatShekels(item.amount)}</bdi>
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
