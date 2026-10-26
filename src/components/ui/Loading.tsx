import { Skeleton } from "./Skeleton";

/** Full-page loading state: a skeleton of a typical screen (title, a banner, a row of cards), so the page never looks frozen. */
export function Loading() {
  return (
    <div role="status" aria-label="טוען" className="flex w-full flex-col gap-5 pt-2">
      <Skeleton className="h-9 w-1/2" />
      <Skeleton className="h-36 w-full rounded-3xl" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-24 rounded-3xl" />
        <Skeleton className="h-24 rounded-3xl" />
      </div>
      <Skeleton className="h-20 w-full rounded-3xl" />
    </div>
  );
}
