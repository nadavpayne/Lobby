import type { Metadata } from "next";
import { AppHeader } from "@/components/AppHeader";
import { AdminApp } from "./AdminApp";

export const metadata: Metadata = { title: "ניהול | לובי", robots: { index: false, follow: false } };

/** /admin — business list for the Lobby operator (ADMIN_EMAIL only, enforced by the API). */
export default function AdminPage() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
        <AdminApp />
      </main>
    </>
  );
}
