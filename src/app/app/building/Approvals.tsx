"use client";

import { useEffect, useState } from "react";
import { Button, Card } from "@/components/ui";
import { decideApproval, fetchApprovals } from "@/lib/api/committee";
import { isApiError } from "@/lib/api/http";
import type { PendingMember } from "@/lib/buildings/types";

/** Phones waiting to join (my apartment, or the whole building for the committee) with approve / reject. Hidden when empty. */
export function Approvals({ token, isCommittee }: { token: string; isCommittee: boolean }) {
  const [pending, setPending] = useState<PendingMember[]>();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    fetchApprovals(token).then((res) => {
      if (!live) return;
      setError(isApiError(res) ? res.error : null);
      if (!isApiError(res)) setPending(res);
    });
    return () => {
      live = false;
    };
  }, [token]);

  /** Sends the decision and drops the request from the list. */
  async function decide(residentId: string, decision: "approve" | "reject") {
    setBusyId(residentId);
    const res = await decideApproval(token, residentId, decision);
    setBusyId(null);
    if (isApiError(res)) return setError(res.error);
    setPending((list) => list?.filter((p) => p.residentId !== residentId));
  }

  if (error) return <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>;
  if (!pending?.length) return null;

  return (
    <Card tint="peach" className="flex flex-col gap-3">
      <h2 className="text-xl font-bold">ממתינים לאישור</h2>
      <p className="text-navy/80">
        {isCommittee ? "חשבון שני בדירה נכנס רק אחרי אישור." : "מישהו ביקש להצטרף לדירה שלכם. אשרו רק אם זה מישהו מהבית."}
      </p>
      <ul className="flex flex-col gap-3">
        {pending.map((p) => (
          <li key={p.residentId} className="flex flex-col gap-2 rounded-2xl bg-white p-4">
            <p className="text-lg font-bold">
              {p.name ?? "ללא שם"} · דירה {p.apartmentNumber}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button size="md" onClick={() => decide(p.residentId, "approve")} disabled={busyId === p.residentId}>אישור</Button>
              <Button size="md" variant="secondary" onClick={() => decide(p.residentId, "reject")} disabled={busyId === p.residentId}>דחייה</Button>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
