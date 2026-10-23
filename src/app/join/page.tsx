import type { Metadata } from "next";
import { AppHeader } from "@/components/AppHeader";
import { JoinForm } from "./JoinForm";

export const metadata: Metadata = { title: "הצטרפות עסקים | לובי" };

/** /join — business onboarding. */
export default function JoinPage() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-lg px-4 py-6">
        <JoinForm />
      </main>
    </>
  );
}
