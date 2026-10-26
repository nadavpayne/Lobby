"use client";

import { UserMinus, UserPlus } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { inputClass } from "@/components/Field";
import { Button, Card, Skeleton } from "@/components/ui";
import { addCashier, fetchCashiers, revokeCashier } from "@/lib/api/biz";
import { isApiError } from "@/lib/api/http";
import type { Cashier } from "@/lib/biz/cashiers";

/** Personal scan-only logins for staff: add by email (they sign in at /start with an email code), revoke any time. */
export function CashiersCard({ token }: { token: string }) {
  const [list, setList] = useState<Cashier[]>();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let live = true;
    fetchCashiers(token).then((res) => live && !isApiError(res) && setList(res));
    return () => {
      live = false;
    };
  }, [token]);

  /** Adds a cashier. */
  async function add(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    const res = await addCashier(token, email);
    setPending(false);
    if (isApiError(res)) return setError(res.error);
    setError(null);
    setEmail("");
    setList(res);
  }

  /** Revokes a cashier after confirming. */
  async function revoke(c: Cashier) {
    if (!confirm(`לבטל את הגישה של ${c.email} לקופה?`)) return;
    const res = await revokeCashier(token, c.userId);
    if (isApiError(res)) setError(res.error);
    else setList(res);
  }

  return (
    <Card className="flex flex-col gap-3">
      <div>
        <h2 className="text-xl font-bold">קופאים</h2>
        <p className="text-sm text-muted">כניסה אישית לכל עובד: סורקים ומאשרים הטבות, בלי גישה לדוחות ובלי אפשרות לבטל מימוש. כל מימוש נרשם עם שם הקופאי.</p>
      </div>
      {!list && <div role="status" aria-label="טוען" className="flex flex-col gap-2"><Skeleton className="h-12 rounded-2xl" /><Skeleton className="h-12 rounded-2xl" /></div>}
      {list && list.length === 0 && <p className="text-sm text-muted">עוד אין קופאים.</p>}
      <ul className="flex flex-col gap-2">
        {list?.map((c) => (
          <li key={c.userId} className="flex items-center gap-2 rounded-2xl bg-cream p-2.5">
            <span dir="ltr" className="min-w-0 flex-1 truncate text-start text-sm">{c.email}</span>
            <button type="button" onClick={() => revoke(c)} aria-label={`ביטול הגישה של ${c.email}`} className="grid size-9 place-items-center rounded-lg hover:bg-navy/5">
              <UserMinus aria-hidden className="size-4" />
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={add} className="flex flex-col gap-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">אימייל של העובד</span>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" inputMode="email" dir="ltr" autoComplete="off" placeholder="name@example.com" className={inputClass} />
        </label>
        <Button type="submit" size="md" variant="secondary" disabled={pending || !email.trim()}><UserPlus aria-hidden className="size-4" /> הוספת קופאי</Button>
        <p className="text-xs text-muted">העובד נכנס בכתובת lobby/start עם קוד שנשלח למייל, ומגיע ישר למסך הסריקה.</p>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      </form>
    </Card>
  );
}
