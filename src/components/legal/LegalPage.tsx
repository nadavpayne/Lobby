import type { ReactNode } from "react";
import { AppHeader } from "@/components/AppHeader";
import { LEGAL } from "@/lib/legal/details";
import { LegalLinks } from "./LegalLinks";

/** Shared layout for legal documents: title, last-updated date, readable body, links to the other documents. */
export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <article
          className="flex flex-col gap-4 rounded-3xl bg-white p-6 text-lg leading-relaxed shadow-soft md:p-10
            [&_a]:font-medium [&_a]:underline [&_h2]:mt-6 [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:mt-2 [&_h3]:text-xl [&_h3]:font-bold
            [&_li]:mt-1 [&_ol]:list-decimal [&_ol]:ps-6 [&_ul]:list-disc [&_ul]:ps-6"
        >
          <h1 className="text-3xl font-bold md:text-4xl">{title}</h1>
          <p className="text-base text-navy/60">עודכן לאחרונה: {LEGAL.updated}</p>
          {children}
        </article>
        <LegalLinks className="mt-6 text-navy/80" />
      </main>
    </>
  );
}

/** The contact email as a mailto link (kept LTR inside Hebrew text). */
export function ContactEmail() {
  return (
    <a href={`mailto:${LEGAL.contactEmail}`} dir="ltr">
      {LEGAL.contactEmail}
    </a>
  );
}
