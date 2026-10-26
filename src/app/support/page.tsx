import type { Metadata } from "next";
import { AppHeader } from "@/components/AppHeader";
import { SupportContent } from "@/components/support/SupportContent";

export const metadata: Metadata = { title: "עזרה ותמיכה | לובי", description: "שאלות נפוצות, טופס פנייה ומחיקת חשבון בלובי." };

/** /support — public help page (the App Store Support URL): contact, FAQ, account deletion, contact form. */
export default function SupportPage() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <h1 className="mb-2 text-3xl font-bold md:text-4xl">עזרה ותמיכה</h1>
        <p className="mb-6 text-lg text-navy/70">יש שאלה או בעיה? כאן תמצאו תשובות, ואפשר גם לכתוב לנו.</p>
        <SupportContent />
      </main>
    </>
  );
}
