"use client";

import { Building2, DoorOpen, LogOut, UserRound } from "lucide-react";
import { Button, Card, DetailRow } from "@/components/ui";
import { useResident } from "../ResidentGate";

/** Profile tab: who I am in Lobby (apartment, building, role) and sign-out. */
export default function ProfileScreen() {
  const { building, signOut } = useResident();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">פרופיל</h1>
      <Card className="flex flex-col gap-2">
        <span aria-hidden className="mb-1 grid size-14 place-items-center rounded-full bg-peach"><UserRound className="size-7" /></span>
        <DetailRow label="תפקיד">{building.role === "committee" ? "ועד הבית" : "דייר/ת"}</DetailRow>
        <DetailRow label="דירה"><span className="inline-flex items-center gap-1"><DoorOpen aria-hidden className="size-4" />{building.apartmentNumber}</span></DetailRow>
        <DetailRow label="בניין"><span className="inline-flex items-center gap-1"><Building2 aria-hidden className="size-4" />{building.name ?? building.address}</span></DetailRow>
        <DetailRow label="כתובת">{building.address}, {building.city}</DetailRow>
      </Card>
      <p className="text-sm text-navy/70">הטבה אחת לדירה בכל עסק, בכל חודש. כל החשבונות בדירה חולקים אותה.</p>
      <Button variant="secondary" onClick={signOut}><LogOut aria-hidden className="size-5 rtl:-scale-x-100" /> יציאה מהחשבון</Button>
    </div>
  );
}
