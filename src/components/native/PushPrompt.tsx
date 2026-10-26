"use client";

import { BellRing } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, Card } from "@/components/ui";
import { dismissPushPrompt, enablePush, shouldPromptPush } from "@/lib/push/device";

/**
 * Our own explanation before iOS asks for notification permission. Shown at a meaningful moment (the resident is
 * in their building's app, or just used a benefit), never on first launch; "not now" hides it on this device.
 */
export function PushPrompt({ token, text }: { token: string; text: string }) {
  const [show, setShow] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    shouldPromptPush().then(setShow);
  }, []);

  if (!show) return null;
  return (
    <Card className="flex flex-col gap-3 bg-peach">
      <span className="flex items-center gap-2 text-lg font-bold"><BellRing aria-hidden className="size-6" /> רוצים לדעת ראשונים?</span>
      <p>{text}</p>
      <div className="flex flex-wrap gap-2">
        <Button size="md" variant="navy" disabled={pending} onClick={async () => { setPending(true); await enablePush(token); setShow(false); }}>
          להפעלת התראות
        </Button>
        <Button size="md" variant="ghost" onClick={() => { dismissPushPrompt(); setShow(false); }}>לא עכשיו</Button>
      </div>
    </Card>
  );
}
