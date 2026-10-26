"use client";

import { NotificationSettings } from "@/components/native/NotificationSettings";
import { useResident } from "../ResidentGate";

/** /app/notifications — the resident's notification switches. */
export default function ResidentNotificationsScreen() {
  const { token } = useResident();
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">התראות</h1>
      <NotificationSettings token={token} audience="resident" />
    </div>
  );
}
