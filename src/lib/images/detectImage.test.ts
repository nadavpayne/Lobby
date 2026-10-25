import assert from "node:assert/strict";
import { test } from "node:test";
import { detectImage } from "./detectImage.ts";

test("images: recognised by their first bytes, not their name", () => {
  assert.deepEqual(detectImage(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0])), { mime: "image/jpeg", ext: "jpg" });
  assert.deepEqual(detectImage(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), { mime: "image/png", ext: "png" });
  assert.deepEqual(detectImage(new TextEncoder().encode("RIFF\0\0\0\0WEBPVP8 ")), { mime: "image/webp", ext: "webp" });
  assert.equal(detectImage(new TextEncoder().encode("<svg onload=alert(1)>")), null); // SVG can carry script: refused
  assert.equal(detectImage(new TextEncoder().encode("%PDF-1.7")), null);
  assert.equal(detectImage(new Uint8Array([])), null);
});
