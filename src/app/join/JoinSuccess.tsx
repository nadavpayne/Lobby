"use client";

import { useState } from "react";
import { native } from "@/lib/native";

/** Post-signup screen: shows the business's personal verification link and lets them save it. */
export function JoinSuccess({ verifyUrl }: { verifyUrl: string }) {
  const [copied, setCopied] = useState(false);

  /** Opens the share sheet (e.g. WhatsApp to themselves) or copies the link. */
  async function save() {
    const result = await native.share.share({ title: "לובי — אימות קודים", text: "הקישור לאימות קודים של לובי (לשימוש העסק בלבד)", url: verifyUrl });
    setCopied(result === "copied");
  }

  return (
    <section className="flex flex-col gap-5">
      <h1 className="text-3xl font-bold">תודה, העסק נרשם!</h1>
      <p className="text-lg">
        זה הקישור האישי שלכם לאימות קודים של דיירים. שמרו אותו בטלפון של העסק: בפעם הראשונה תתבקשו להזין את קוד ה-PIN.
      </p>
      <p dir="ltr" className="select-all break-all rounded-xl bg-white p-4 font-mono text-sm">{verifyUrl}</p>
      <button type="button" onClick={save} className="min-h-14 rounded-xl bg-amber text-xl font-bold text-navy">
        שמירת הקישור
      </button>
      {copied && <p role="status" className="text-center">הקישור הועתק</p>}
      <a href={verifyUrl} className="flex min-h-14 items-center justify-center rounded-xl border-2 border-navy text-xl font-bold">
        למסך האימות
      </a>
      <p className="rounded-xl bg-navy/5 p-4">העסק ממתין לאישור שלנו. נעדכן אתכם כשההטבה תעלה לדיירים.</p>
    </section>
  );
}
