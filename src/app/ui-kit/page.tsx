import type { Metadata } from "next";
import { Gallery } from "./Gallery";

export const metadata: Metadata = { title: "ספריית רכיבים | לובי", robots: { index: false, follow: false } };

/** /ui-kit — every shared component on one page, for design review. Not linked from the app. */
export default function UiKitPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <Gallery />
    </main>
  );
}
