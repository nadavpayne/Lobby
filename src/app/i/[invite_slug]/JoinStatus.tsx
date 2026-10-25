import Link from "next/link";
import { primaryButton } from "@/components/ui";
import type { MyBuilding } from "@/lib/buildings/types";

/** After joining (or when already a member): welcome, or a different building. */
export function JoinStatus({ mine, sameBuilding }: { mine: MyBuilding; sameBuilding: boolean }) {
  const where = `${mine.address}, ${mine.city}`;

  if (!sameBuilding) {
    return (
      <p className="rounded-xl bg-white p-5 text-lg">
        החשבון הזה כבר רשום בבניין אחר: {where}, דירה {mine.apartmentNumber}. כדי לעבור בניין פנו לוועד הבית.
      </p>
    );
  }
  return (
    <section className="flex flex-col gap-3 rounded-2xl bg-white p-6">
      <h1 className="text-2xl font-bold">ברוכים הבאים ללובי!</h1>
      <p className="text-lg">
        אתם רשומים ב{where}, דירה {mine.apartmentNumber}.
      </p>
      <Link href="/app" className={primaryButton}>להטבות שלי</Link>
    </section>
  );
}
