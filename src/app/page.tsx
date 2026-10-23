import { AppHeader } from "@/components/AppHeader";

/** Placeholder home page until the resident flow (Phase 2) exists. */
export default function Home() {
  return (
    <>
      <AppHeader />
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-3xl font-bold">מועדון ההטבות של הבניין שלכם</h1>
        <p className="max-w-sm text-lg">
          הנחה של <bdi dir="ltr">10%</bdi> בעסקים בשכונה, לדיירי הבניין בלבד. ההצטרפות דרך ועד הבית.
        </p>
      </main>
    </>
  );
}
