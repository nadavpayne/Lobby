"use client";

import { useState } from "react";
import { primaryButton } from "@/components/ui";
import { native } from "@/lib/native";

/** The building's invite link, with a share button for the residents' WhatsApp group. */
export function InviteLink({ address, inviteUrl }: { address: string; inviteUrl: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const result = await native.share.share({
      title: "לובי | מועדון ההטבות של הבניין",
      text: `הבניין שלנו (${address}) הצטרף ללובי: 10% הנחה בעסקים בשכונה, רק לדיירים. נרשמים כאן:`,
      url: inviteUrl,
    });
    setCopied(result === "copied");
  }

  return (
    <section className="flex flex-col gap-5">
      <h1 className="text-3xl font-bold">הבניין רשום!</h1>
      <p className="text-lg">
        זה קישור ההצטרפות של <strong>{address}</strong>. שלחו אותו בקבוצת הווטסאפ של הבניין. כל דייר נרשם עם האימייל שלו ובוחר את
        מספר הדירה.
      </p>
      <p dir="ltr" className="select-all break-all rounded-xl bg-white p-4 font-mono text-sm">{inviteUrl}</p>
      <button type="button" onClick={share} className={primaryButton}>שליחה לקבוצת הבניין</button>
      {copied && <p role="status" className="text-center">הקישור הועתק</p>}
      <ul className="flex list-disc flex-col gap-1 rounded-xl bg-navy/5 p-4 ps-8">
        <li>עד 2 חשבונות לכל דירה. החשבון השני בדירה מחכה לאישור.</li>
        <li>אפשר לחזור לדף הזה בכל זמן כדי לקבל שוב את הקישור.</li>
      </ul>
    </section>
  );
}
