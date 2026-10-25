import assert from "node:assert/strict";
import { test } from "node:test";
import { countByStatus, sortForReview } from "./sortBusinesses.ts";
import type { AdminBusiness } from "./types.ts";

const biz = (id: string, status: AdminBusiness["status"], createdAt: string) => ({ id, status, createdAt }) as AdminBusiness;

test("pending first, then leads, active, paused; newest first within a group", () => {
  const list = [
    biz("a1", "active", "2026-10-01"),
    biz("p-old", "pending", "2026-10-02"),
    biz("x", "paused", "2026-10-20"),
    biz("p-new", "pending", "2026-10-22"),
    biz("a2", "active", "2026-10-05"),
    biz("l", "lead", "2026-10-21"),
  ];
  assert.deepEqual(sortForReview(list).map((b) => b.id), ["p-new", "p-old", "l", "a2", "a1", "x"]);
  assert.deepEqual(countByStatus(list), { lead: 1, pending: 2, active: 2, paused: 1 });
});
