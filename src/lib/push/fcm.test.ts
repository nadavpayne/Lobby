import assert from "node:assert/strict";
import { test } from "node:test";
import { fcmMessage, isDeadToken } from "./fcmMessage.ts";

test("FCM message: visible notification, tap path in data, high priority", () => {
  const m = fcmMessage("tok", { title: "הטבה חדשה", body: "קפה השכונה הצטרף", url: "/app/b/1" }).message;
  assert.equal(m.token, "tok");
  assert.deepEqual(m.notification, { title: "הטבה חדשה", body: "קפה השכונה הצטרף" });
  assert.deepEqual(m.data, { url: "/app/b/1" });
  assert.equal(m.android.priority, "high");
});

test("dead tokens: unregistered or invalid are dropped, server errors are kept", () => {
  assert.ok(isDeadToken(404, '{"error":{"status":"NOT_FOUND","details":[{"errorCode":"UNREGISTERED"}]}}'));
  assert.ok(isDeadToken(400, '{"error":{"message":"The registration token is not a valid FCM registration token"}}'));
  assert.ok(!isDeadToken(500, '{"error":{"status":"INTERNAL"}}'));
  assert.ok(!isDeadToken(429, '{"error":{"status":"RESOURCE_EXHAUSTED"}}'));
  assert.ok(!isDeadToken(400, '{"error":{"message":"Invalid JSON payload"}}')); // our bug, not the device's
});
