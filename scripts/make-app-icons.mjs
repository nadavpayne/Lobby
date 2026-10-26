// Generates the iOS and Android app icons and splash screens from the Lobby house mark.
// Run: node scripts/make-app-icons.mjs   (after changing the logo)
import { existsSync, readdirSync, renameSync } from "node:fs";
import sharp from "sharp";

const NAVY = "#14254A";
const HOUSE = `
  <path d="M16 56 L60 18 L104 56 V102 Q104 112 94 112 H26 Q16 112 16 102 Z" fill="#FFFFFF"/>
  <path d="M51 62 V88 H69" fill="none" stroke="${NAVY}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M10 56 L60 14 L110 56" fill="none" stroke="#F28E2A" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>`;

/** A square navy canvas with the white house centered at `share` of its width. */
const art = (size, share) => {
  const scale = (size * share) / 110; // the mark spans x 5..115
  const offset = (size - 110 * scale) / 2 - 5 * scale;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" fill="${NAVY}"/>
    <g transform="translate(${offset} ${offset - 2 * scale}) scale(${scale})">${HOUSE}</g></svg>`);
};

const out = "ios/App/App/Assets.xcassets";
// App Store icon: opaque (no alpha channel), iOS rounds the corners itself.
await sharp(art(1024, 0.6)).flatten({ background: NAVY }).removeAlpha().png().toFile(`${out}/AppIcon.appiconset/AppIcon-512@2x.png`);
for (const name of ["splash-2732x2732.png", "splash-2732x2732-1.png", "splash-2732x2732-2.png"]) {
  await sharp(art(2732, 0.16)).removeAlpha().png().toFile(`${out}/Splash.imageset/${name}`);
}
await sharp(art(1024, 0.6)).removeAlpha().png().toFile("native/app-store-icon-1024.png");

// Android: launcher icons per density (legacy square/round 48dp, adaptive foreground 108dp on the navy background
// color in values/ic_launcher_background.xml) and every splash.png at the size Capacitor generated it.
const res = "android/app/src/main/res";
const DENSITIES = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
const circle = (size) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}"/></svg>`);
for (const [d, k] of Object.entries(DENSITIES)) {
  const icon = Math.round(48 * k), fg = Math.round(108 * k);
  await sharp(art(icon, 0.6)).png().toFile(`${res}/mipmap-${d}/ic_launcher.png`);
  await sharp(art(icon, 0.6)).composite([{ input: circle(icon), blend: "dest-in" }]).png().toFile(`${res}/mipmap-${d}/ic_launcher_round.png`);
  // The adaptive mask crops to the middle ~66%, so the mark sits at 40% of the 108dp canvas.
  await sharp(art(fg, 0.4)).png().toFile(`${res}/mipmap-${d}/ic_launcher_foreground.png`);
}
for (const dir of readdirSync(res).filter((n) => n.startsWith("drawable"))) {
  const file = `${res}/${dir}/splash.png`;
  if (!existsSync(file)) continue;
  const { width, height } = await sharp(file).metadata();
  const side = Math.max(width, height);
  const square = await sharp(art(side, 0.16)).png().toBuffer();
  // Written beside and renamed: sharp can't overwrite the file it just read the size of.
  await sharp(square).extract({ left: Math.round((side - width) / 2), top: Math.round((side - height) / 2), width, height }).png().toFile(`${file}.tmp`);
  renameSync(`${file}.tmp`, file);
}
console.log("icons and splash written");
