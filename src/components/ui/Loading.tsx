/** Full-screen "טוען…" state: a spinning amber ring above the text, so the page never looks frozen. */
export function Loading() {
  return (
    <div role="status" className="flex flex-col items-center gap-3 pt-10 text-lg text-navy/70">
      <span aria-hidden className="size-10 animate-spin rounded-full border-4 border-navy/15 border-t-amber" />
      טוען…
    </div>
  );
}
