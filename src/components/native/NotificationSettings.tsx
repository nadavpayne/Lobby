"use client";

import { useEffect, useState } from "react";
import { Button, Card, Skeleton } from "@/components/ui";
import { isApiError } from "@/lib/api/http";
import { fetchPushPrefs, savePushPrefs } from "@/lib/api/push";
import { native } from "@/lib/native";
import { enablePush } from "@/lib/push/device";
import { PREF_LABELS, type NotificationPrefs } from "@/lib/push/prefs";

/** Notification preferences: one switch per type for this audience, plus turning notifications on for this device. */
export function NotificationSettings({ token, audience }: { token: string; audience: "resident" | "business" }) {
  const [prefs, setPrefs] = useState<NotificationPrefs>();
  const [permission, setPermission] = useState<string>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPushPrefs(token).then((res) => (isApiError(res) ? setError(res.error) : setPrefs(res)));
    native.push.permission().then(setPermission);
  }, [token]);

  /** Flips one switch (optimistic; reverts if saving fails). */
  async function toggle(type: keyof NotificationPrefs, on: boolean) {
    if (!prefs) return;
    setPrefs({ ...prefs, [type]: on });
    const res = await savePushPrefs(token, { [type]: on });
    if (isApiError(res)) {
      setError(res.error);
      setPrefs(prefs);
    }
  }

  if (error) return <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>;
  if (!prefs) return <Skeleton className="h-48 w-full rounded-3xl" />;
  return (
    <div className="flex flex-col gap-4">
      {permission === "unsupported" && <p className="rounded-2xl bg-cream p-3">התראות זמינות באפליקציית לובי לאייפון.</p>}
      {permission === "prompt" && (
        <Button variant="navy" onClick={async () => setPermission((await enablePush(token)) ? "granted" : "denied")}>הפעלת התראות במכשיר הזה</Button>
      )}
      {permission === "denied" && <p className="rounded-2xl bg-peach p-3">ההתראות כבויות בהגדרות האייפון: הגדרות ← לובי ← עדכונים.</p>}
      <Card className="flex flex-col py-1">
        {PREF_LABELS.filter((p) => p.audience === audience).map((p) => (
          <label key={p.type} className="flex min-h-16 cursor-pointer items-center gap-3 border-b border-navy/10 last:border-0">
            <span className="flex flex-1 flex-col">
              <span className="font-medium">{p.label}</span>
              <span className="text-sm text-muted">{p.hint}</span>
            </span>
            <input type="checkbox" role="switch" checked={prefs[p.type]} onChange={(e) => toggle(p.type, e.target.checked)} className="size-6 accent-navy" />
          </label>
        ))}
      </Card>
    </div>
  );
}
