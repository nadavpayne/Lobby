import Link from "next/link";
import { primaryButton } from "@/components/ui";

/** Post-signup screen: where the owner signs in to approve discounts (email code), and that the business awaits review. */
export function JoinSuccess({ loginUrl, email }: { loginUrl: string; email: string }) {
  return (
    <section className="flex flex-col gap-5">
      <h1 className="text-3xl font-bold">תודה, העסק נרשם!</h1>
      <p className="text-lg">
        את ההנחות לדיירים מאשרים באזור העסק: נכנסים עם האימייל <bdi dir="ltr" className="font-bold">{email}</bdi> ומקבלים קוד
        כניסה במייל. משם סורקים את קוד ה-QR של הדייר, ואפשר גם להוסיף חשבונות לעובדי הקופה.
      </p>
      <Link href={loginUrl} className={primaryButton}>כניסה לאזור העסק</Link>
      <p className="rounded-xl bg-navy/5 p-4">העסק ממתין לאישור שלנו. נעדכן אתכם כשההטבה תעלה לדיירים.</p>
    </section>
  );
}
