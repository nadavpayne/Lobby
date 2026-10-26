import assert from "node:assert/strict";
import { test } from "node:test";
import { PER_EMAIL_PER_HOUR, PER_IP_PER_HOUR } from "./config.ts";
import { isBot, rateLimited, validateSupport } from "./validate.ts";

const valid = { name: "דנה", email: " Dana@Example.com ", role: "resident", topic: "account", message: "לא מצליחה להיכנס" };

test("a valid request is cleaned up", () => {
  assert.deepEqual(validateSupport(valid), { ok: true, data: { name: "דנה", email: "dana@example.com", role: "resident", topic: "account", message: "לא מצליחה להיכנס" } });
});

test("required fields and message length", () => {
  const bad = validateSupport({});
  assert.equal(bad.ok, false);
  if (!bad.ok) assert.deepEqual(Object.keys(bad.errors).sort(), ["email", "message", "name", "role", "topic"]);
  assert.equal(validateSupport({ ...valid, message: "x".repeat(2000) }).ok, true);
  assert.equal(validateSupport({ ...valid, message: "x".repeat(2001) }).ok, false);
  assert.equal(validateSupport({ ...valid, email: "not-an-email" }).ok, false);
  assert.equal(validateSupport({ ...valid, topic: "billing" }).ok, false);
  assert.equal(validateSupport(null).ok, false);
});

test("honeypot", () => {
  assert.equal(isBot({ ...valid, website: "http://spam" }), true);
  assert.equal(isBot({ ...valid, website: "" }), false);
  assert.equal(isBot(valid), false);
});

test("rate limit per IP and per email", () => {
  assert.equal(rateLimited({ byIp: PER_IP_PER_HOUR - 1, byEmail: PER_EMAIL_PER_HOUR - 1 }), false);
  assert.equal(rateLimited({ byIp: PER_IP_PER_HOUR, byEmail: 0 }), true);
  assert.equal(rateLimited({ byIp: 0, byEmail: PER_EMAIL_PER_HOUR }), true);
});
