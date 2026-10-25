import Link from "next/link";
import { Menu } from "lucide-react";

const ITEMS = [
  ["/start", "כניסה"],
  ["/join", "הצטרפות עסקים"],
] as const;

/** Home header menu: a white three-line button that opens the sign-in / business links. Native <details>, no JS. */
export function HomeMenu() {
  return (
    <details className="group relative z-30">
      <summary aria-label="תפריט" className="grid size-11 cursor-pointer list-none place-items-center rounded-full text-white hover:bg-white/10 [&::-webkit-details-marker]:hidden">
        <Menu className="size-7" aria-hidden />
      </summary>
      <ul className="absolute end-0 top-full mt-2 w-48 overflow-hidden rounded-2xl bg-white py-1 shadow-lift">
        {ITEMS.map(([href, label]) => (
          <li key={href}>
            <Link href={href} className="flex min-h-11 items-center px-4 font-bold text-navy hover:bg-navy/5">{label}</Link>
          </li>
        ))}
      </ul>
    </details>
  );
}
