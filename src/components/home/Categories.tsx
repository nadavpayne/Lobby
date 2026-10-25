import { CATEGORIES, type Category } from "@/lib/businesses/categories";

const ICONS: Record<Exclude<Category, "other">, string> = {
  food: "☕",
  grocery: "🛒",
  bakery: "🥐",
  beauty: "💇",
  fitness: "🏋️",
  health: "💊",
  pets: "🐾",
  services: "🔧",
  home: "🛋️",
  kids: "🧸",
};

/** Tiles of the kinds of neighborhood businesses in the club (from the shared category list). */
export function Categories() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-14">
      <h2 className="mb-2 text-3xl font-bold">הטבות בעסקים שליד הבית</h2>
      <p className="mb-8 text-lg text-navy/70">בתי קפה, מאפיות, מספרות, חדרי כושר ועוד, במרחק הליכה מהבניין.</p>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(Object.keys(ICONS) as (keyof typeof ICONS)[]).map((key) => (
          <li key={key} className="flex flex-col items-center gap-2 rounded-2xl bg-white p-5 text-center shadow-sm">
            <span aria-hidden className="text-4xl">{ICONS[key]}</span>
            <span className="font-medium">{CATEGORIES[key]}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
