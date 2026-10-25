/** Shimmering placeholder block while data loads. Size it with className (h-*, w-*, rounded-*). */
export function Skeleton({ className = "h-5 w-full" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`block animate-shimmer rounded-xl bg-[linear-gradient(90deg,rgb(31_58_95/0.06),rgb(31_58_95/0.12),rgb(31_58_95/0.06))] bg-[length:200%_100%] ${className}`}
    />
  );
}

/** A card-shaped skeleton (image + two lines), for feeds and lists. */
export function SkeletonCard() {
  return (
    <div role="status" aria-label="טוען" className="flex flex-col gap-3 rounded-3xl bg-white p-4 shadow-soft">
      <Skeleton className="h-32 w-full rounded-2xl" />
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}
