// Generates the iOS app icon (1024×1024, opaque) and splash screens from the Lobby house mark.
// Run: node scripts/make-app-icons.mjs   (after changing the logo)
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
console.log("icons and splash written");
