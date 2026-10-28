import { CategoryIcon } from "@/components/ui";
import { CATEGORIES, CATEGORY_ICONS, type Category } from "@/lib/businesses/categories";
import { WalkingDistanceIllustration } from "./WalkingDistanceIllustration";

/** The categories shown on the home page (every primary category except the catch-all). */
const SHOWN = (Object.keys(CATEGORY_ICONS) as Category[]).filter((key) => key !== "other");

/**
 * "Walking distance" section: the promise as a picture (the house with walking-time rings), then tiles of the kinds
 * of neighborhood businesses in the club, with the same icons the resident app uses. Phone: heading, picture, tiles;
 * desktop: heading and tiles on the right, the picture beside them.
 */
export function Categories() {
  return (
    <section className="mx-auto grid max-w-5xl items-center gap-x-10 gap-y-8 px-4 py-14 md:grid-cols-[1.25fr_1fr]">
      <div>
        <h2 className="mb-2 text-3xl font-bold">הטבות בעסקים שליד הבית</h2>
        <p className="text-lg text-navy/70">בתי קפה, מאפיות, מספרות, חדרי כושר ועוד, במרחק הליכה מהבניין.</p>
      </div>
      <div className="md:col-start-2 md:row-span-2 md:row-start-1">
        <WalkingDistanceIllustration />
      </div>
      <ul className="grid grid-cols-2 gap-3 self-start sm:grid-cols-4 md:grid-cols-3">
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
