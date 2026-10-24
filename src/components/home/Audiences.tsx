import Link from "next/link";
import type { ReactNode } from "react";
import { primaryButton } from "@/components/ui";
import { ShareWithCommittee } from "./ShareWithCommittee";

/** One audience card: title, short pitch, bullet points and its call to action. */
function AudienceCard({ id, title, pitch, points, children }: { id: string; title: string; pitch: string; points: string[]; children: ReactNode }) {
  return (
    <article id={id} className="flex scroll-mt-36 flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm">
      <h3 className="text-2xl font-bold">{title}</h3>
      <p className="text-lg">{pitch}</p>
      <ul className="flex flex-1 flex-col gap-2">
        {points.map((point) => (
          <li key={point} className="flex gap-2">
            <span aria-hidden className="font-bold text-amber">✓</span>
            {point}
          </li>
        ))}
      </ul>
      {children}
    </article>
  );
}

/** Residents / house committees / businesses: what each side gets and what to do next. */
export function Audiences() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-14">
      <h2 className="mb-8 text-3xl font-bold">לובי בשבילכם</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <AudienceCard
          id="residents"
          title="לדיירים"
          pitch="הנחות קבועות בעסקים שאתם כבר הולכים אליהם."
          points={["10% הנחה בכל עסק במועדון", "קוד אישי בטלפון, בלי כרטיס ובלי אפליקציה", "רואים כמה חסכתם כל חודש"]}
        >
          <p className="text-navy/70">הבניין שלכם עוד לא בלובי?</p>
          <ShareWithCommittee />
        </AudienceCard>

        <AudienceCard
          id="committees"
          title="לוועדי בית"
          pitch="הטבה אמיתית לכל הדיירים, בלי לנהל כלום."
          points={["קישור אחד לקבוצת הווטסאפ, וזהו", "התראות על הטבות חדשות ליד הבניין", "דוח חודשי: כמה הבניין חסך", "חינם בתקופת הניסיון"]}
        >
          <Link href="/building/new" className={primaryButton}>רישום הבניין</Link>
        </AudienceCard>

        <AudienceCard
          id="businesses"
          title="לעסקים"
          pitch="לקוחות חדשים מהבניינים שסביבכם. משלמים רק על מכירה."
          points={["10% הנחה לדייר + 5% עמלה, רק על מימוש שאימתתם", "בלי דמי הצטרפות ובלי מנוי", "מאמתים קוד מהטלפון, בלי מערכת קופה", "מימוש אחד לדירה בחודש"]}
        >
          <Link href="/join" className={primaryButton}>הצטרפות עסקים</Link>
          <p className="text-sm text-navy/70">כבר רשומים? פתחו את הקישור האישי ששמרתם בהרשמה.</p>
        </AudienceCard>
      </div>
    </section>
  );
}
