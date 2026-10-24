const LINKS = [
  ["#how", "איך זה עובד"],
  ["#residents", "לדיירים"],
  ["#committees", "לוועדי בית"],
  ["#businesses", "לעסקים"],
  ["#faq", "שאלות נפוצות"],
] as const;

/** Quick-jump chips under the header; scrolls sideways on narrow screens. */
export function NavChips() {
  return (
    <nav aria-label="ניווט בעמוד" className="border-b border-navy/10 bg-cream/95 backdrop-blur">
      <ul className="mx-auto flex max-w-5xl gap-2 overflow-x-auto px-4 py-2 [scrollbar-width:none]">
        {LINKS.map(([href, label]) => (
          <li key={href} className="shrink-0">
            <a href={href} className="flex min-h-11 items-center rounded-full border border-navy/20 bg-white px-4 font-medium">
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
