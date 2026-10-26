"use client";

import { NotificationSettings } from "@/components/native/NotificationSettings";
import { useBiz } from "../BizShell";

/** /biz/notifications — the business owner's notification switches (daily summary, off by default). */
export default function BizNotificationsScreen() {
  const { token } = useBiz();
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">התראות</h1>
      <NotificationSettings token={token} audience="business" />
    </div>
  );
}
