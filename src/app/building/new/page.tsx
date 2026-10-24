import type { Metadata } from "next";
import { AppHeader } from "@/components/AppHeader";
import { RegisterBuilding } from "./RegisterBuilding";

export const metadata: Metadata = { title: "רישום בניין | לובי" };

/** /building/new — a house committee member registers their building and gets the invite link. */
export default function RegisterBuildingPage() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6">
        <RegisterBuilding />
      </main>
    </>
  );
}
