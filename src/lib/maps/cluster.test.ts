import assert from "node:assert/strict";
import { test } from "node:test";
import { clusterPoints } from "./cluster.ts";

const at = (id: string, lat: number, lng: number) => ({ id, point: { lat, lng } });
const herzl = at("herzl", 32.0625, 34.77);
const nextDoor = at("nextDoor", 32.0627, 34.7702); // ~30 m away
const petahTikva = at("pt", 32.0904, 34.8805); // ~11 km away

test("cluster: zoomed out, a city's places merge; zoomed in, each stands alone", () => {
  assert.equal(clusterPoints([herzl, nextDoor, petahTikva], 9).length, 1);
  assert.deepEqual(clusterPoints([herzl, nextDoor, petahTikva], 13).map((g) => g.map((x) => x.id)), [["herzl", "nextDoor"], ["pt"]]);
  assert.equal(clusterPoints([herzl, nextDoor, petahTikva], 19).length, 3);
});
