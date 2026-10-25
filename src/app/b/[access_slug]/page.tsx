import type { Metadata } from "next";
import { Suspense } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Loading } from "@/components/ui";
import { BusinessTerminal } from "./BusinessTerminal";

export const metadata: Metadata = {
  title: "אימות קודים | לובי",
  robots: { index: false, follow: false },
  referrer: "no-referrer", // the URL itself is the business's secret link
};

const loading = <Loading />;

/** /b/[access_slug] — business verification terminal. Path is a future universal/app link: keep it stable. */
export default function TerminalPage({ params }: PageProps<"/b/[access_slug]">) {
  return (
    <>
      <AppHeader />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-6">
        <Suspense fallback={loading}>
          <Terminal params={params} />
        </Suspense>
      </main>
    </>
  );
}

/** Resolves the slug at request time (inside Suspense, so the shell above stays prerendered). */
async function Terminal({ params }: Pick<PageProps<"/b/[access_slug]">, "params">) {
  const { access_slug } = await params;
  return <BusinessTerminal slug={access_slug} />;
}
