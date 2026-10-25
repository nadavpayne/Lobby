import Link from "next/link";
import { primaryButton, secondaryButton } from "@/components/ui";

const STATS = [
  ["10%", "הנחה לדיירים בעסקים בשכונה"],
  ["0 ₪", "לוועד הבית בתקופת הניסיון"],
] as const;

/** Illustration of the resident's code screen (not live data). */
function PhoneMock() {
  return (
    <div aria-hidden className="mx-auto w-64 rounded-[2.5rem] border-[10px] border-navy bg-white p-5 shadow-xl">
      <p className="text-sm text-navy/60">הקוד שלך ב-</p>
      <p className="text-xl font-bold">קפה השכונה</p>
      <p className="mt-3 inline-block rounded-full bg-amber/25 px-3 py-1 font-bold">10% הנחה</p>
      <p dir="ltr" className="mt-5 rounded-2xl bg-cream py-4 text-center font-mono text-4xl font-bold tracking-[0.2em]">
        K7M4QX
      </p>
      <p className="mt-3 text-center text-sm text-navy/60">הציגו בקופה · בתוקף 24 שעות</p>
    </div>
  );
}

/** Top of the home page: what Lobby is, the two main calls to action, and the key numbers. */
export function Hero() {
  return (
    <section className="mx-auto grid w-full max-w-5xl items-center gap-10 px-4 py-12 md:grid-cols-2 md:py-20">
      <div className="flex flex-col gap-6">
        <h1 className="text-4xl leading-tight font-bold md:text-5xl">ההטבות של השכונה, רק לדיירי הבניין שלכם</h1>
        <p className="text-xl leading-relaxed">
          לובי הוא מועדון הטבות סגור לבנייני מגורים. ועד הבית משתף קישור בקבוצת הווטסאפ, והדיירים מקבלים{" "}
          <bdi dir="ltr">10%</bdi> הנחה בעסקים שליד הבית.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/join" className={primaryButton}>יש לי עסק בשכונה</Link>
          <a href="#committees" className={secondaryButton}>אני מוועד הבית</a>
        </div>
        <p className="text-navy/70">דיירים? ההצטרפות רק דרך הקישור שהוועד שולח.</p>
      </div>
      <PhoneMock />
      <dl className="grid gap-3 sm:grid-cols-2 md:col-span-2">
        {STATS.map(([value, label]) => (
          <div key={label} className="rounded-2xl bg-white p-5 shadow-sm">
            <dt className="text-navy/70">{label}</dt>
            <dd dir="ltr" className="text-end text-3xl font-bold text-navy">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
