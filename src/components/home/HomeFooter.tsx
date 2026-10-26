import Link from "next/link";
import { LegalLinks } from "@/components/legal/LegalLinks";
import { Lockup } from "@/components/Lockup";
import { primaryButton } from "@/components/ui";

/** Closing call to action and footer links. */
export function HomeFooter() {
  return (
    <footer className="bg-navy pb-6 text-cream">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-5 px-4 py-14 text-center">
        <h2 className="text-3xl font-bold">בואו נביא את לובי לשכונה שלכם</h2>
        <Link href="/join" className={`${primaryButton} max-w-sm`}>הצטרפות עסקים</Link>
      </div>
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 border-t border-cream/15 px-4 pt-6 sm:flex-row sm:justify-between">
        <Lockup />
        <nav aria-label="קישורים" className="flex flex-wrap justify-center gap-x-5">
          <a href="#how" className="flex min-h-11 items-center">איך זה עובד</a>
          <Link href="/join" className="flex min-h-11 items-center">הצטרפות עסקים</Link>
          <a href="#faq" className="flex min-h-11 items-center">שאלות נפוצות</a>
          <Link href="/support" className="flex min-h-11 items-center">תמיכה</Link>
        </nav>
        <p className="text-sm text-cream/70">© 2026 לובי</p>
      </div>
      <LegalLinks className="mx-auto max-w-5xl px-4 pt-2 text-sm text-cream/80" />

    </footer>
  );
}
