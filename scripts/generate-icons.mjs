// Renders the PWA PNG icons from public/logo.svg (the single icon source). Run: npm run icons
import sharp from "sharp";

for (const size of [192, 512]) {
  await sharp("public/logo.svg", { density: 300 }).resize(size, size).png().toFile(`public/icon-${size}.png`);
  console.log(`public/icon-${size}.png`);
}
