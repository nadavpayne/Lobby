"use client";

import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { SettingsLinks } from "@/components/account/SettingsLinks";
import { Field, inputClass } from "@/components/Field";
import { Button, Card, DetailRow, Skeleton } from "@/components/ui";
import { fetchProfile, saveProfile } from "@/lib/api/biz";
import { isApiError } from "@/lib/api/http";
import type { BizProfile } from "@/lib/biz/types";
import { validateProfile, type ProfileErrors } from "@/lib/biz/validateProfile";
import { CATEGORIES, type Category } from "@/lib/businesses/categories";
import { useBiz } from "../BizShell";
import { LogoUpload } from "../LogoUpload";
import { CashiersCard } from "./CashiersCard";
import { HoursEditor } from "./HoursEditor";
import { StaffCard } from "./StaffCard";

/** /biz/profile — business details, opening hours, branches, and staff terminal access. */
export default function ProfileScreen() {
  const { token, setLogo } = useBiz();
  const [p, setP] = useState<BizProfile>();
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let live = true;
    fetchProfile(token).then((res) => {
      if (!live) return;
      if (isApiError(res)) setMessage({ ok: false, text: res.error });
      else setP(res);
    });
    return () => {
      live = false;
    };
  }, [token]);

  if (!p) return message ? <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{message.text}</p> : <Skeleton className="h-96 w-full rounded-3xl" />;

  const set = <K extends keyof BizProfile>(key: K, value: BizProfile[K]) => setP({ ...p, [key]: value });
  const field = (key: "description" | "phone" | "address") => ({
    value: p[key] ?? "",
    onChange: (e: { target: { value: string } }) => set(key, e.target.value),
    "aria-invalid": !!errors[key],
  });

  /** Validates and saves details, hours and branches. */
  async function submit(e: FormEvent) {
    e.preventDefault();
    const v = validateProfile(p);
    if (!v.ok) return setErrors(v.errors);
    setErrors({});
    setPending(true);
    const res = await saveProfile(token, v.data);
    setPending(false);
    if (isApiError(res)) return setMessage({ ok: false, text: res.error });
    if ("errors" in res) return setErrors(res.errors);
    setP(res);
    setMessage({ ok: true, text: "נשמר. השינויים כבר מופיעים לדיירים." });
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">העסק</h1>
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <form onSubmit={submit} className="flex flex-col gap-6" noValidate>
          <Card className="flex flex-col gap-4">
            <h2 className="text-xl font-bold">פרטים</h2>
            <LogoUpload token={token} businessName={p.name} logoUrl={p.logoUrl} onUploaded={(logoUrl) => { set("logoUrl", logoUrl); setLogo(logoUrl); }} />
            <div className="flex flex-col gap-1">
              <DetailRow label="שם">{p.name}</DetailRow>
              <DetailRow label="קטגוריה">{CATEGORIES[p.category as Category] ?? p.category}</DetailRow>
              <DetailRow label="עמלת לובי"><bdi dir="ltr">{p.commissionPercent}%</bdi></DetailRow>
            </div>
            <p className="text-sm text-navy/60">לשינוי שם, קטגוריה או תנאי העמלה כתבו לצוות לובי.</p>
            <Field label="על העסק" error={errors.description} hint="מופיע בדף העסק אצל הדיירים"><textarea {...field("description")} maxLength={400} rows={3} className={`${inputClass} py-2`} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="טלפון" error={errors.phone}><input {...field("phone")} inputMode="tel" dir="ltr" className={inputClass} /></Field>
              <Field label={`כתובת${p.city ? `, ${p.city}` : ""}`} error={errors.address}><input {...field("address")} className={inputClass} /></Field>
            </div>
          </Card>

          <Card className="flex flex-col gap-3">
            <h2 className="text-xl font-bold">שעות פתיחה</h2>
            <HoursEditor hours={p.hours} onChange={(h) => set("hours", h)} />
            {errors.hours && <p role="alert" className="text-sm text-red-700">{errors.hours}</p>}
          </Card>

          <Card className="flex flex-col gap-3">
            <h2 className="text-xl font-bold">סניפים</h2>
            <p className="-mt-2 text-sm text-navy/60">אם יש לכם יותר מסניף אחד, הוסיפו את כולם. הדיירים יראו את הרשימה בדף העסק.</p>
            {p.branches.map((b, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                <input aria-label="שם הסניף" value={b.name} placeholder="שם הסניף" onChange={(e) => set("branches", p.branches.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} className={inputClass} />
                <input aria-label="כתובת הסניף" value={b.address} placeholder="כתובת" onChange={(e) => set("branches", p.branches.map((x, j) => (j === i ? { ...x, address: e.target.value } : x)))} className={inputClass} />
                <button type="button" aria-label="מחיקת סניף" onClick={() => set("branches", p.branches.filter((_, j) => j !== i))} className="grid size-12 place-items-center rounded-xl hover:bg-navy/5">
                  <Trash2 aria-hidden className="size-5" />
                </button>
              </div>
            ))}
            {errors.branches && <p role="alert" className="text-sm text-red-700">{errors.branches}</p>}
            <Button size="md" variant="ghost" onClick={() => set("branches", [...p.branches, { name: "", address: "" }])} className="self-start">
              <Plus aria-hidden className="size-4" /> הוספת סניף
            </Button>
          </Card>

          {message && <p role={message.ok ? "status" : "alert"} className={`rounded-2xl p-3 ${message.ok ? "bg-mint" : "bg-red-50 text-red-800"}`}>{message.text}</p>}
          <Button type="submit" disabled={pending}>{pending ? "שומרים…" : "שמירת השינויים"}</Button>
        </form>
        <aside className="flex flex-col gap-6">
          <CashiersCard token={token} />
          <StaffCard token={token} terminalUrl={p.terminalUrl} />
          <SettingsLinks base="/biz" />
        </aside>
      </div>
    </div>
  );
}
