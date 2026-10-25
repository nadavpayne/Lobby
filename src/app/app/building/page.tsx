"use client";

import { MessageCircle, Phone, Users } from "lucide-react";
import Link from "next/link";
import { buttonClass, Card, DetailRow, StatTile } from "@/components/ui";
import { useResident } from "../ResidentGate";
import { Approvals } from "./Approvals";
import { BuildingStatsCard } from "./BuildingStatsCard";
import { NotificationsCard } from "./NotificationsCard";

/** "0521234567" → "972521234567" for wa.me links. */
const whatsappNumber = (phone: string) => phone.replace(/\D/g, "").replace(/^0/, "972");

/** Building tab: neighbors in Lobby, committee contact, my apartment, phones waiting for my approval; the committee also gets stats and the invite link. */
export default function BuildingScreen() {
  const { token, building } = useResident();
  const isCommittee = building.role === "committee";
  const phone = building.committeePhone;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold">{building.name ?? "הבניין"}</h1>
        <p className="text-navy/70">{building.address}, {building.city}</p>
      </div>
      <NotificationsCard token={token} />
      <Approvals token={token} isCommittee={isCommittee} />
      {building.neighbors !== undefined && (
        <StatTile tint="lilac" icon={<Users />} label="שכנים בלובי" value={building.neighbors} hint="חשבונות פעילים בבניין, כולל שלכם" />
      )}
      {isCommittee && <BuildingStatsCard token={token} />}

      {!isCommittee && (building.committeeName || phone) && (
        <Card className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">ועד הבית</h2>
          {building.committeeName && <p>{building.committeeName}</p>}
          {phone && (
            <div className="grid grid-cols-2 gap-2">
              <a href={`tel:${phone}`} className={buttonClass("secondary", "md")}><Phone aria-hidden className="size-4" /> חיוג</a>
              <a href={`https://wa.me/${whatsappNumber(phone)}`} target="_blank" rel="noopener noreferrer" className={buttonClass("primary", "md")}>
                <MessageCircle aria-hidden className="size-4" /> ווטסאפ
              </a>
            </div>
          )}
        </Card>
      )}

      <Card className="flex flex-col gap-2">
        <DetailRow label="דירה">{building.apartmentNumber}</DetailRow>
        <DetailRow label="תפקיד">{isCommittee ? "ועד הבית" : "דייר/ת"}</DetailRow>
      </Card>
      {isCommittee && <Link href="/building/new" className={buttonClass("primary")}>קישור ההצטרפות לבניין</Link>}
    </div>
  );
}
