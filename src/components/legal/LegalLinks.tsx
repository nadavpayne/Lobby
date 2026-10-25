import Link from "next/link";
import { LEGAL_PAGES } from "@/lib/legal/details";

/** Links to all legal documents (footers, end of each legal page). */
export function LegalLinks({ className = "" }: { className?: string }) {
  return (
    <nav aria-label="מסמכים משפטיים" className={`flex flex-wrap justify-center gap-x-5 ${className}`}>
      {LEGAL_PAGES.map(([href, label]) => (
        <Link key={href} href={href} className="flex min-h-11 items-center underline-offset-4 hover:underline">
          {label}
        </Link>
      ))}
    </nav>
  );
}
