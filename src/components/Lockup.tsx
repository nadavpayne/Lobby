/** Brand lockup (logo + "Lobby" wordmark) for navy backgrounds. Always laid out LTR, even inside RTL pages. */
export function Lockup({ className = "" }: { className?: string }) {
  return (
    <span dir="ltr" className={`inline-flex items-center gap-2 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- static SVG, nothing to optimize */}
      <img src="/logo.svg" alt="" className="h-9 w-9" />
      <span className="font-brand text-2xl text-white">Lobby</span>
    </span>
  );
}
