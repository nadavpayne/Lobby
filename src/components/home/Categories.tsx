import { CategoryIcon } from "@/components/ui";
import { CATEGORIES, CATEGORY_ICONS, type Category } from "@/lib/businesses/categories";

/** The categories shown on the home page (every primary category except the catch-all). */
const SHOWN = (Object.keys(CATEGORY_ICONS) as Category[]).filter((key) => key !== "other");

/** Tiles of the kinds of neighborhood businesses in the club, with the same icons the resident app uses. */
export function Categories() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-14">
      <h2 className="mb-2 text-3xl font-bold">הטבות בעסקים שליד הבית</h2>
      <p className="mb-8 text-lg text-navy/70">בתי קפה, מאפיות, מספרות, חדרי כושר ועוד, במרחק הליכה מהבניין.</p>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {SHOWN.map((key) => (
          <li key={key} className="flex flex-col items-center gap-2 rounded-2xl bg-white p-5 text-center shadow-sm">
            <CategoryIcon name={CATEGORY_ICONS[key]} className="size-9 text-amber" />
            <span className="font-medium">{CATEGORIES[key]}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
