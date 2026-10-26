"use client";

import { WifiOff } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { native } from "@/lib/native";
import { syncPush } from "@/lib/push/device";
import { getBrowserClient } from "@/lib/supabase/browser";

/**
 * iOS app glue (renders nothing in a browser): universal links and notification taps open the right screen, the
 * marketing home page goes to the app's start, the device's push token follows the signed-in account, and losing
 * the connection shows a Hebrew offline screen instead of a browser error.
 */
export function NativeBridge() {
  const router = useRouter();
  const path = usePathname();
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if (!native.isApp) return;
    native.links.onOpen((to) => router.push(to));
    native.push.onOpen((to) => router.push(to));
    getBrowserClient()?.auth.getSession().then(({ data }) => data.session && syncPush(data.session.access_token));
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, [router]);

  useEffect(() => {
    if (native.isApp && path === "/") router.replace("/start"); // the app has no marketing page: straight to my area
  }, [path, router]);

  if (!offline) return null;
  return (
    <div role="alertdialog" aria-label="אין חיבור" className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-cream p-6 text-center text-navy">
      <WifiOff aria-hidden className="size-14" />
      <h1 className="text-2xl font-bold">אין חיבור לאינטרנט</h1>
      <p className="max-w-xs text-lg">לובי צריך חיבור כדי להציג הטבות ולממש אותן. בדקו את ה-Wi-Fi או את הנתונים הסלולריים.</p>
      <button type="button" onClick={() => navigator.onLine ? (setOffline(false), router.refresh()) : setOffline(true)} className="min-h-14 min-w-56 rounded-xl bg-amber px-6 text-xl font-bold">
        ניסיון חוזר
      </button>
    </div>
  );
}
