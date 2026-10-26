import type { Metadata } from "next";
import { AppHeader } from "@/components/AppHeader";
import { SetPassword } from "./SetPassword";

export const metadata: Metadata = { title: "קביעת סיסמה | לובי" };

/** /account/password — set or reset the account's password (any role). */
export default function PasswordPage() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6">
        <SetPassword />
      </main>
    </>
  );
}
