import type { Metadata } from "next";
import { Suspense } from "react";
import { AppHeader } from "@/components/AppHeader";
import { getBuildingByInvite } from "@/lib/buildings/inviteBuilding";
import { createAdminClient } from "@/lib/supabase/admin";
import { JoinBuilding } from "./JoinBuilding";

export const metadata: Metadata = {
  title: "הצטרפות לבניין | לובי",
  robots: { index: false, follow: false },
  referrer: "no-referrer", // the URL is the building's private invite link
};

const loading = <p className="pt-10 text-center text-lg text-navy/70">טוען…</p>;

/** /i/[invite_slug] — residents join their building. Path is a future universal/app link: keep it stable. */
export default function InvitePage({ params }: PageProps<"/i/[invite_slug]">) {
  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6">
        <Suspense fallback={loading}>
          <Invite params={params} />
        </Suspense>
      </main>
    </>
  );
}

/** Looks up the building at request time (inside Suspense, so the shell above stays prerendered). */
async function Invite({ params }: Pick<PageProps<"/i/[invite_slug]">, "params">) {
  const { invite_slug } = await params;
  const building = await getBuildingByInvite(createAdminClient(), invite_slug);
  if (!building) {
    return <p role="alert" className="rounded-xl bg-white p-5 text-lg">קישור ההצטרפות לא תקין. בקשו מוועד הבית את הקישור העדכני.</p>;
  }
  if (!building.active) {
    return <p role="alert" className="rounded-xl bg-white p-5 text-lg">הבניין הזה לא פעיל כרגע בלובי.</p>;
  }
  return <JoinBuilding inviteSlug={invite_slug} building={building} />;
}
