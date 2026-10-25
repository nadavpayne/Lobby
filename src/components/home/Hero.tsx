import Link from "next/link";
import { primaryButton, secondaryButton } from "@/components/ui";
import { NotificationPhone } from "./NotificationPhone";

const STATS = [
  ["10%", "הנחה לדיירים בעסקים בשכונה"],
  ["0 ₪", "לוועד הבית בתקופת הניסיון"],
] as const;

/** Top of the home page: what Lobby is, the two main calls to action, and the key numbers. */
export function Hero() {
  return (
    <section className="mx-auto grid w-full max-w-5xl grid-cols-[1fr_auto] items-center gap-x-3 gap-y-6 px-4 pt-5 pb-12 md:grid-cols-2 md:gap-x-10 md:py-20">
      {/* Mobile: headline + text beside a shrunk phone, buttons underneath. Desktop: text column + full phone. */}
      <div className="flex flex-col gap-3 md:col-start-1 md:row-start-1 md:gap-6 md:self-end">
        <h1 className="text-2xl leading-tight font-bold md:text-5xl">ההטבות של השכונה, רק לדיירי הבניין שלכם</h1>
        <p className="text-sm leading-relaxed md:text-xl">
          לובי הוא מועדון הטבות סגור לבנייני מגורים. ועד הבית משתף קישור בקבוצת הווטסאפ, והדיירים מקבלים{" "}
          <bdi dir="ltr">10%</bdi> הנחה בעסקים שליד הבית.
        </p>
      </div>
      <div className="[zoom:0.65] md:col-start-2 md:row-span-2 md:row-start-1 md:[zoom:1]">
        <NotificationPhone />
      </div>
      <div className="col-span-2 flex flex-col gap-3 md:col-span-1 md:col-start-1 md:self-start">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/join" className={primaryButton}>יש לי עסק בשכונה</Link>
          <a href="#committees" className={secondaryButton}>אני מוועד הבית</a>
        </div>
        <p className="text-navy/70">דיירים? ההצטרפות רק דרך הקישור שהוועד שולח.</p>
      </div>
      <dl className="col-span-2 grid gap-3 sm:grid-cols-2">
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
