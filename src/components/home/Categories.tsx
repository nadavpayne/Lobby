import { WalkingDistanceIllustration } from "./WalkingDistanceIllustration";

/**
 * "Walking distance" section: the promise in words and as a picture (the house with walking-time rings).
 * Phone: heading, then the picture; desktop: heading on the right, the picture beside it.
 */
export function Categories() {
  return (
    <section className="mx-auto grid max-w-5xl items-center gap-x-10 gap-y-8 px-4 py-14 md:grid-cols-[1.25fr_1fr]">
      <div>
        <h2 className="mb-2 text-3xl font-bold">הטבות בעסקים שליד הבית</h2>
        <p className="text-lg text-navy/70">בתי קפה, מאפיות, מספרות, חדרי כושר ועוד, במרחק הליכה מהבניין.</p>
      </div>
      <WalkingDistanceIllustration />
    </section>
  );
}
