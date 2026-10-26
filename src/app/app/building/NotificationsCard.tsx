"use client";

import { Megaphone } from "lucide-react";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui";
import { isApiError } from "@/lib/api/http";
import { fetchNotifications } from "@/lib/api/resident";
import type { ResidentNotification } from "@/lib/buildings/notifications";

const when = new Intl.DateTimeFormat("he-IL", { timeZone: "Asia/Jerusalem", day: "numeric", month: "numeric" });

/** "עדכונים מלובי": the latest announcements for this building; hidden when there are none. */
export function NotificationsCard({ token }: { token: string }) {
  const [items, setItems] = useState<ResidentNotification[]>([]);

  useEffect(() => {
    let live = true;
    fetchNotifications(token).then((res) => live && !isApiError(res) && setItems(res));
    return () => {
      live = false;
    };
  }, [token]);

  if (items.length === 0) return null;
  return (
    <Card tint="peach" className="flex flex-col gap-3">
      <h2 className="flex items-center gap-2 text-lg font-bold"><Megaphone aria-hidden className="size-5" /> עדכונים מלובי</h2>
      <ul className="flex flex-col gap-3">
        {items.map((n) => (
          <li key={n.id} className="flex flex-col gap-0.5">
            <span className="flex items-baseline justify-between gap-2"><span className="font-bold">{n.title}</span><span className="shrink-0 text-sm text-muted">{when.format(new Date(n.createdAt))}</span></span>
            <span>{n.body}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
