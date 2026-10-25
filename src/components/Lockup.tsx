import { Logo } from "@/components/ui";

/** Brand lockup (logo + "Lobby" wordmark) for navy backgrounds. Always laid out LTR, even inside RTL pages. */
export function Lockup({ className = "" }: { className?: string }) {
  return (
    <span dir="ltr" className={`inline-flex items-center gap-2 ${className}`}>
      <Logo className="h-9 w-9" tone="dark" />
      <span className="font-brand text-2xl text-white">Lobby</span>
    </span>
  );
}
