"use client";

import { CheckCircle2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Field, inputClass } from "@/components/Field";
import { Button } from "@/components/ui";
import { sendSupportRequest } from "@/lib/api/support";
import { MESSAGE_MAX, RESPONSE_TIME, SUPPORT_ROLES, SUPPORT_TOPICS, type SupportRole } from "@/lib/support/config";
import { validateSupport, type SupportErrors } from "@/lib/support/validate";

export interface SupportPrefill {
  name?: string;
  email?: string;
  role?: SupportRole;
}

/** The contact form: name, email, role, topic, message (+ a hidden honeypot); then the "we'll get back to you" state. */
export function SupportForm({ prefill = {}, token }: { prefill?: SupportPrefill; token?: string }) {
  const [errors, setErrors] = useState<SupportErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [length, setLength] = useState(0);

  /** Validates in the browser, then sends. */
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const raw = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const check = validateSupport(raw);
    if (!check.ok) return setErrors(check.errors);
    setErrors({});
    setPending(true);
    const res = await sendSupportRequest(raw, token);
    setPending(false);
    if ("error" in res) {
      setErrors(res.errors ?? {});
      setError(res.errors ? null : res.error);
    } else setSent(true);
  }

  if (sent) {
    return (
      <div role="status" className="flex flex-col items-center gap-2 rounded-3xl bg-mint p-6 text-center">
        <CheckCircle2 aria-hidden className="size-12 text-emerald-700" />
        <p className="text-xl font-bold">הפנייה התקבלה, תודה!</p>
        <p>{RESPONSE_TIME}.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <Field label="שם" error={errors.name}>
        <input name="name" defaultValue={prefill.name} autoComplete="name" maxLength={80} aria-invalid={!!errors.name} className={inputClass} />
      </Field>
      <Field label="אימייל לתשובה" error={errors.email}>
        <input name="email" type="email" defaultValue={prefill.email} autoComplete="email" dir="ltr" aria-invalid={!!errors.email} className={inputClass} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="אני" error={errors.role}>
          <select name="role" defaultValue={prefill.role ?? ""} aria-invalid={!!errors.role} className={inputClass}>
            <option value="" disabled>בחירה</option>
            {SUPPORT_ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
        <Field label="נושא" error={errors.topic}>
          <select name="topic" defaultValue="" aria-invalid={!!errors.topic} className={inputClass}>
            <option value="" disabled>בחירה</option>
            {SUPPORT_TOPICS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
      </div>
      <Field label="ההודעה" hint={`${length}/${MESSAGE_MAX}`} error={errors.message}>
        <textarea name="message" rows={5} maxLength={MESSAGE_MAX} onChange={(e) => setLength(e.target.value.length)} aria-invalid={!!errors.message} className={`${inputClass} py-2`} />
      </Field>
      {/* Honeypot: hidden from people; bots that fill it are ignored. */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -start-[9999px] size-px opacity-0" />
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-red-800">{error}</p>}
      <Button type="submit" disabled={pending}>{pending ? "שולחים…" : "שליחת הפנייה"}</Button>
    </form>
  );
}
