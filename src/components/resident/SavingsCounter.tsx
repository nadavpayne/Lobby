import { PiggyBank } from "lucide-react";
import Link from "next/link";
import { formatShekels } from "@/lib/redemptions/money";

/** "חסכת ₪X מאז שהצטרפת" — links to the wallet. */
export function SavingsCounter({ saved }: { saved: number }) {
  return (
    <Link href="/app/wallet" className="flex items-center gap-3 rounded-3xl bg-mint p-4 shadow-soft transition active:scale-[0.98]">
      <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-full bg-white text-navy">
        <PiggyBank className="size-6" />
      </span>
      <p className="text-lg">
        {saved > 0 ? (
          <>חסכתם <bdi dir="ltr" className="text-2xl font-bold">{formatShekels(saved)}</bdi> מאז שהצטרפתם</>
        ) : (
          <>עוד לא מימשתם הטבה. <span className="font-bold">הראשונה מחכה לכם למטה</span></>
        )}
      </p>
    </Link>
  );
}
