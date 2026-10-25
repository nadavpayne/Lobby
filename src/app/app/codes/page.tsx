"use client";

import { useEffect, useState } from "react";
import { isApiError } from "@/lib/api/http";
import { fetchCodeHistory } from "@/lib/api/resident";
import type { CodeHistory, CodeHistoryItem } from "@/lib/offers/types";
import { formatShekels } from "@/lib/redemptions/money";
import { useResident } from "../ResidentGate";

const date = new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" });

const STATUS: Record<CodeHistoryItem["status"], [string, string]> = {
  issued: ["פעיל", "bg-amber/25"],
  redeemed: ["מומש", "bg-emerald-100 text-emerald-900"],
  expired: ["פג תוקף", "bg-navy/10"],
};

/** "My codes" tab: savings this month and in total, and the apartment's codes. */
export default function CodesScreen() {
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

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">הקודים שלי</h1>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}
      {!history && !error && <p className="pt-6 text-center text-lg text-navy/70">טוען…</p>}

      {history && (
        <>
          <dl className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-navy p-4 text-cream">
              <dt>חסכתם החודש</dt>
              <dd className="text-3xl font-bold"><bdi dir="ltr">{formatShekels(history.savedThisMonth)}</bdi></dd>
            </div>
            <div className="rounded-2xl bg-white p-4">
              <dt className="text-navy/70">סה״כ חסכתם</dt>
              <dd className="text-3xl font-bold"><bdi dir="ltr">{formatShekels(history.savedTotal)}</bdi></dd>
            </div>
          </dl>
          <p className="text-sm text-navy/70">הקודים והחיסכון משותפים לכל החשבונות בדירה.</p>

          {history.items.length === 0 && <p className="rounded-2xl bg-white p-6 text-lg">עוד אין קודים. בחרו הטבה בלשונית „הטבות“.</p>}
          <ul className="flex flex-col gap-3">
            {history.items.map((item) => {
              const [label, tone] = STATUS[item.status];
              return (
                <li key={item.code + item.issuedAt} className="flex flex-col gap-1 rounded-2xl bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-lg font-bold">{item.businessName}</p>
                    <span className={`rounded-full px-3 py-0.5 text-sm ${tone}`}>{label}</span>
                  </div>
                  <p className="flex justify-between gap-3 text-navy/70">
                    <bdi dir="ltr" className="font-mono">{item.code}</bdi>
                    <bdi dir="ltr">{date.format(new Date(item.redeemedAt ?? item.issuedAt))}</bdi>
                  </p>
                  {item.status === "redeemed" && item.discountAmount !== null && (
                    <p>חסכתם <bdi dir="ltr">{formatShekels(item.discountAmount)}</bdi> מתוך <bdi dir="ltr">{formatShekels(item.amount ?? 0)}</bdi></p>
                  )}
                  {item.status === "issued" && <p className="text-sm">הקוד פעיל. כדי להציג אותו בקופה פתחו את העסק בלשונית „הטבות“.</p>}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
