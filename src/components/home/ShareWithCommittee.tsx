"use client";

import { useState } from "react";
import { secondaryButton } from "@/components/ui";
import { native } from "@/lib/native";

/** Lets a resident send Lobby to their house committee (share sheet, or copies the link). */
export function ShareWithCommittee() {
  const [copied, setCopied] = useState(false);

  async function share() {
    const result = await native.share.share({
      title: "לובי — מועדון הטבות לבניין",
      text: "מצאתי מועדון הטבות לבנייני מגורים: 10% הנחה בעסקים בשכונה. שווה לבדוק לבניין שלנו:",
      url: window.location.origin,
    });
    setCopied(result === "copied");
  }

  return (
    <>
      <button type="button" onClick={share} className={secondaryButton}>שליחה לוועד הבית</button>
      {copied && <p role="status" className="text-center">הקישור הועתק</p>}
    </>
  );
}
