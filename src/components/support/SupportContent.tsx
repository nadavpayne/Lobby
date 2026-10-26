import Link from "next/link";
import { LegalLinks } from "@/components/legal/LegalLinks";
import { RESPONSE_TIME, SUPPORT_EMAIL } from "@/lib/support/config";
import { SUPPORT_FAQ } from "@/lib/support/faq";
import { SupportForm, type SupportPrefill } from "./SupportForm";

interface Props {
  /** In the app: the signed-in user's details for the form. */
  prefill?: SupportPrefill;
  token?: string;
  /** Where "delete my account" goes for a signed-in user. */
  deleteHref?: string;
}

/** Help and support: contact, FAQ by audience, how to delete an account, the contact form and the legal links. Same on /support and in the app. */
export function SupportContent({ prefill, token, deleteHref = "/account/delete" }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2 rounded-3xl bg-white p-5 shadow-soft">
        <h2 className="text-xl font-bold">צרו קשר</h2>
        <p>
          {SUPPORT_EMAIL
            ? <>אפשר לכתוב לנו ל-<a href={`mailto:${SUPPORT_EMAIL}`} dir="ltr" className="font-medium underline">{SUPPORT_EMAIL}</a> או למלא את הטופס למטה.</>
            : <>הדרך הכי מהירה: הטופס למטה.</>}
          {" "}{RESPONSE_TIME}.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">שאלות נפוצות</h2>
        {SUPPORT_FAQ.map(([audience, items]) => (
          <div key={audience} className="flex flex-col gap-2">
            <h3 className="font-bold text-navy/70">{audience}</h3>
            {items.map(([q, a]) => (
              <details key={q} className="group rounded-2xl bg-white px-4 shadow-soft">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 font-bold">
                  {q}
                  <span aria-hidden className="text-xl transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="pb-4 leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        ))}
      </section>

      <section id="delete" className="flex flex-col gap-2 rounded-3xl bg-white p-5 shadow-soft">
        <h2 className="text-xl font-bold">מחיקת חשבון</h2>
        <p>
          אפשר למחוק את החשבון בעצמכם, באפליקציה או באתר: בהגדרות (פרופיל) ← &quot;מחיקת חשבון&quot;. אחרי אימות בקוד שנשלח לאימייל, החשבון
          נמחק מיד. רשומות מימוש וחיוב נשמרות לצורכי הנהלת חשבונות, בלי קישור אליכם.
        </p>
        <Link href={deleteHref} className="self-start font-medium underline">למחיקת החשבון (צריך להיות מחוברים)</Link>
      </section>

      <section id="contact" className="flex flex-col gap-3 rounded-3xl bg-white p-5 shadow-soft">
        <h2 className="text-xl font-bold">טופס פנייה</h2>
        <SupportForm prefill={prefill} token={token} />
      </section>

      <LegalLinks className="text-navy/80" />
    </div>
  );
}
