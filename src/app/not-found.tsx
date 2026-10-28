import { SearchX } from "lucide-react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { buttonClass, EmptyState } from "@/components/ui";

/** Any address that doesn't exist (a mistyped or old link): Hebrew, in Lobby's frame, with a way back. */
export default function NotFound() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-10">
        <EmptyState
          icon={<SearchX />}
          title="הדף הזה לא קיים"
          action={<Link href="/start" className={buttonClass("primary", "md")}>לאפליקציה שלי</Link>}
        >
          אולי הקישור ישן או שחסרה בו אות. דיירים שקיבלו קישור מוועד הבית: בקשו מהוועד לשלוח אותו שוב.{" "}
          <Link href="/support" className="font-bold underline">עזרה ותמיכה</Link>
        </EmptyState>
      </main>
    </>
  );
}
