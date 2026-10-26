"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { CheckCircle2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { inputClass } from "@/components/Field";
import { Button, Card, Skeleton } from "@/components/ui";
import type { AccountDeletionInfo } from "@/lib/account/deleteAccount";
import { deleteMyAccount, fetchDeletionInfo } from "@/lib/api/account";
import { isApiError } from "@/lib/api/http";

type Step = "explain" | "code" | "confirm" | "done";

/** Account deletion: what happens → a fresh email code → final destructive confirmation → signed out everywhere. */
export function DeleteAccountFlow({ supabase, token }: { supabase: SupabaseClient; token: string }) {
  const [info, setInfo] = useState<AccountDeletionInfo>();
  const [step, setStep] = useState<Step>("explain");
  const [handoverTo, setHandoverTo] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    fetchDeletionInfo(token).then((res) => (isApiError(res) ? setError(res.error) : setInfo(res)));
  }, [token]);

  /** Emails a fresh one-time code to the account's address. */
  async function sendCode() {
    if (!info) return;
    setPending(true);
    setError(null);
    const { error: sendError } = await supabase.auth.signInWithOtp({ email: info.email, options: { shouldCreateUser: false } });
    setPending(false);
    if (sendError) return setError("לא הצלחנו לשלוח קוד. נסו שוב בעוד דקה.");
    setStep("code");
  }

  /** Deletes the account, then forgets the session on this device too. */
  async function remove() {
    setPending(true);
    setError(null);
    const res = await deleteMyAccount(token, code.trim(), handoverTo || null);
    setPending(false);
    if (isApiError(res)) {
      setError(res.error);
      if (res.unauthorized) setStep("code");
      return;
    }
    await supabase.auth.signOut({ scope: "local" });
    setStep("done");
  }

  if (step === "done") {
    return (
      <Card className="flex flex-col items-center gap-3 text-center">
        <CheckCircle2 aria-hidden className="size-14 text-emerald-700" />
        <h2 className="text-2xl font-bold">החשבון נמחק</h2>
        <p>נותקתם מכל המכשירים. תודה שהייתם איתנו.</p>
        <Link href="/" className="font-medium underline">לדף הבית</Link>
      </Card>
    );
  }
  if (!info) return error ? <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p> : <Skeleton className="h-64 w-full rounded-3xl" />;
  const n = info.notice;
  if (!n.allowed) return <p className="rounded-xl bg-peach p-4">חשבון ניהול לא נמחק מהאפליקציה. פנו לצוות לובי.</p>;

  return (
    <div className="flex flex-col gap-4">
      {step === "explain" && (
        <>
          <Card className="flex flex-col gap-2">
            <h2 className="text-lg font-bold">מה נמחק</h2>
            <ul className="list-disc ps-5">{n.deleted.map((d) => <li key={d}>{d}</li>)}</ul>
            <h2 className="mt-2 text-lg font-bold">מה נשמר, ולמה</h2>
            <ul className="list-disc ps-5">{n.kept.map((d) => <li key={d}>{d}</li>)}</ul>
            {n.business.length > 0 && (
              <>
                <h2 className="mt-2 text-lg font-bold">העסק שלכם</h2>
                <ul className="list-disc ps-5">{n.business.map((d) => <li key={d}>{d}</li>)}</ul>
              </>
            )}
          </Card>
          {n.committeeHandover && (
            <Card className="flex flex-col gap-2 bg-peach">
              <h2 className="text-lg font-bold">אתם חבר/ת הוועד היחיד/ה בבניין</h2>
              <p>כדאי להעביר את תפקיד הוועד לדייר/ת אחר/ת לפני המחיקה. אם לא, הבניין יישאר פעיל בלי ועד, וצוות לובי יקבל הודעה.</p>
              {info.handoverCandidates.length > 0 ? (
                <label className="flex flex-col gap-1">
                  <span className="font-medium">להעביר את תפקיד הוועד ל:</span>
                  <select value={handoverTo} onChange={(e) => setHandoverTo(e.target.value)} className={inputClass}>
                    <option value="">לא להעביר</option>
                    {info.handoverCandidates.map((c) => <option key={c.id} value={c.id}>{c.name} · דירה {c.apartment}</option>)}
                  </select>
                </label>
              ) : <p className="text-sm">אין עדיין דיירים פעילים אחרים בבניין שאפשר להעביר אליהם.</p>}
            </Card>
          )}
          <Button variant="danger" disabled={pending} onClick={sendCode}>{pending ? "שולחים קוד…" : "המשך: שליחת קוד אימות למייל"}</Button>
        </>
      )}

      {step === "code" && (
        <Card className="flex flex-col gap-3">
          <p>שלחנו קוד חד-פעמי ל-<bdi dir="ltr" className="font-bold">{info.email}</bdi>. הקלידו אותו כדי לאשר שזה אתם.</p>
          <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} inputMode="numeric" autoComplete="one-time-code" maxLength={8} dir="ltr" aria-label="קוד האימות" className={`${inputClass} max-w-48 text-center text-2xl tracking-widest`} />
          <div className="flex flex-wrap gap-2">
            <Button size="md" variant="navy" disabled={code.length < 6} onClick={() => setStep("confirm")}>המשך</Button>
            <Button size="md" variant="ghost" disabled={pending} onClick={sendCode}>שליחת קוד חדש</Button>
          </div>
        </Card>
      )}

      {step === "confirm" && (
        <Card className="flex flex-col gap-3 border-2 border-red-700">
          <h2 className="text-xl font-bold">בטוחים?</h2>
          <p>המחיקה מיידית ואי אפשר לבטל אותה.{n.business.length > 0 ? " העסק ייצא מהמועדון." : ""}</p>
          <Button variant="danger" disabled={pending} onClick={remove}><Trash2 aria-hidden className="size-5" /> {pending ? "מוחקים…" : "מחיקת החשבון לצמיתות"}</Button>
          <Button size="md" variant="ghost" onClick={() => setStep("explain")}>ביטול</Button>
        </Card>
      )}

      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-red-800">{error}</p>}
    </div>
  );
}
