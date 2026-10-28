"use client";

import { RefreshCw, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { Button, EmptyState } from "@/components/ui";

/**
 * A screen that crashed: Hebrew, in Lobby's frame, with a retry. The server already reported the error to the admin
 * (instrumentation.ts); the reference code lets support find it.
 */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-10">
        <EmptyState
          icon={<TriangleAlert />}
          title="משהו השתבש"
          action={<Button size="md" onClick={reset}><RefreshCw aria-hidden className="size-4" /> לנסות שוב</Button>}
        >
          תקלה אצלנו, לא אצלכם. נסו שוב בעוד רגע. אם זה חוזר,{" "}
          <Link href="/support" className="font-bold underline">פנו לתמיכה</Link>
          {error.digest && <> וציינו את הקוד <bdi dir="ltr" className="font-mono">{error.digest}</bdi></>}.
        </EmptyState>
      </main>
    </>
  );
}
