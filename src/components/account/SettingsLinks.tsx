"use client";

import { Bell, ChevronDown, ChevronLeft, Ellipsis, LifeBuoy, Trash2 } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui";
import { native } from "@/lib/native";

const row = "flex min-h-12 items-center gap-3 border-b border-navy/10 last:border-0";

/**
 * Bottom of the settings screens: notifications (in the app), help & support, "more options" (which opens to
 * delete account, so the destructive action is one deliberate tap away), and the app version for support requests.
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
        <details className="group border-b border-navy/10 last:border-0">
          <summary className={`${row} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}>
            <Ellipsis aria-hidden className="size-5" /> <span className="flex-1">אפשרויות נוספות</span>
            <ChevronDown aria-hidden className="size-5 transition-transform group-open:rotate-180" />
          </summary>
          <Link href="/account/delete" className={`${row} ps-8 text-red-700`}>
            <Trash2 aria-hidden className="size-5" /> <span className="flex-1">מחיקת חשבון</span> <ChevronLeft aria-hidden className="size-5 rtl:-scale-x-100" />
          </Link>
        </details>
      </Card>
      <p className="text-center text-sm text-muted">לובי · גרסה <bdi dir="ltr">{process.env.NEXT_PUBLIC_APP_VERSION}</bdi></p>
    </>
  );
}
