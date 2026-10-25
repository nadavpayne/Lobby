import type { Metadata } from "next";
import { AppHeader } from "@/components/AppHeader";
import { StartRouter } from "./StartRouter";

export const metadata: Metadata = { title: "כניסה | לובי", robots: { index: false, follow: false } };

/** /start — one sign-in for everyone; then each account goes to its own app by its role. */
export default function StartPage() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 pt-5 pb-10">
        <StartRouter />
      </main>
    </>
  );
}
