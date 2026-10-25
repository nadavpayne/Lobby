"use client";

import Link from "next/link";
import { primaryButton, secondaryButton } from "@/components/ui";
import { useResident } from "../ResidentGate";

/** Building tab: my building and apartment; the committee gets to its invite link. */
export default function BuildingScreen() {
  const { building, signOut } = useResident();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">הבניין</h1>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-2xl bg-white p-5 text-lg">
        <dt className="text-navy/70">כתובת</dt>
        <dd>{building.address}, {building.city}</dd>
        <dt className="text-navy/70">דירה</dt>
        <dd>{building.apartmentNumber}</dd>
        <dt className="text-navy/70">תפקיד</dt>
        <dd>{building.role === "committee" ? "ועד הבית" : "דייר/ת"}</dd>
      </dl>
      {building.role === "committee" && (
        <Link href="/building/new" className={primaryButton}>קישור ההצטרפות לבניין</Link>
      )}
      <button type="button" onClick={signOut} className={secondaryButton}>יציאה מהחשבון</button>
    </div>
  );
}
