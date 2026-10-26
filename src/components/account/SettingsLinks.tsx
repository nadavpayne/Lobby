"use client";

import { Bell, ChevronLeft, LifeBuoy, Trash2 } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui";
import { native } from "@/lib/native";

const row = "flex min-h-12 items-center gap-3 border-b border-navy/10 last:border-0";

/**
 * Bottom of the settings screens: notifications (in the app), help & support, delete account (destructive, last),
 * and the app version for support requests.
 */
export function SettingsLinks({ base }: { base: "/app" | "/biz" }) {
  return (
    <>
      <Card className="flex flex-col py-1">
        {native.isApp && (
          <Link href={`${base}/notifications`} className={row}>
            <Bell aria-hidden className="size-5" /> <span className="flex-1">התראות</span> <ChevronLeft aria-hidden className="size-5 rtl:-scale-x-100" />
          </Link>
        )}
        <Link href={`${base}/help`} className={row}>
          <LifeBuoy aria-hidden className="size-5" /> <span className="flex-1">עזרה ותמיכה</span> <ChevronLeft aria-hidden className="size-5 rtl:-scale-x-100" />
        </Link>
        <Link href="/account/delete" className={`${row} text-red-700`}>
          <Trash2 aria-hidden className="size-5" /> <span className="flex-1">מחיקת חשבון</span> <ChevronLeft aria-hidden className="size-5 rtl:-scale-x-100" />
        </Link>
      </Card>
      <p className="text-center text-sm text-navy/50">לובי · גרסה <bdi dir="ltr">{process.env.NEXT_PUBLIC_APP_VERSION}</bdi></p>
    </>
  );
}
