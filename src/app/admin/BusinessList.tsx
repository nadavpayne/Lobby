"use client";

import { useEffect, useState } from "react";
import { countByStatus, sortForReview } from "@/lib/admin/sortBusinesses";
import type { AdminBusiness, StatusChange } from "@/lib/admin/types";
import { changeBusinessStatus, fetchAdminBusinesses } from "@/lib/api/admin";
import { isApiError } from "@/lib/api/http";
import { BusinessCard } from "./BusinessCard";

interface Props {
  token: string;
  email: string;
  onSignOut: () => void;
}

/** All businesses, pending first, with activate / pause actions. */
export function BusinessList({ token, email, onSignOut }: Props) {
  const [businesses, setBusinesses] = useState<AdminBusiness[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    fetchAdminBusinesses(token).then((res) => {
      if (!live) return;
      setError(isApiError(res) ? res.error : null);
      if (!isApiError(res)) setBusinesses(res);
    });
    return () => {
      live = false;
    };
  }, [token]);

  /** Changes a business's status and updates it in place; returns an error message or null. */
  async function setStatus(id: string, status: StatusChange): Promise<string | null> {
    const res = await changeBusinessStatus(token, id, status);
    if (isApiError(res)) return res.error;
    setBusinesses((list) => list && list.map((b) => (b.id === id ? res : b)));
    return null;
  }

  const counts = businesses && countByStatus(businesses);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">עסקים</h1>
        <div className="flex items-center gap-2 text-sm text-navy/70">
          <bdi dir="ltr">{email}</bdi>
          <button type="button" onClick={onSignOut} className="min-h-11 px-2 underline">יציאה</button>
        </div>
      </div>

      {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}
      {!businesses && !error && <p className="text-center text-lg text-navy/70">טוען…</p>}

      {counts && (
        <p className="flex flex-wrap gap-2">
          <span className="rounded-full bg-amber/25 px-3 py-1">ממתינים: {counts.pending}</span>
          <span className="rounded-full bg-emerald-100 px-3 py-1">פעילים: {counts.active}</span>
          <span className="rounded-full bg-navy/10 px-3 py-1">מושהים: {counts.paused}</span>
        </p>
      )}

      {businesses?.length === 0 && <p className="text-center text-lg text-navy/70">עדיין אין עסקים רשומים.</p>}
      {businesses && sortForReview(businesses).map((b) => <BusinessCard key={b.id} business={b} onSetStatus={setStatus} />)}
    </div>
  );
}
