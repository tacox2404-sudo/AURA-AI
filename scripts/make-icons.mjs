// Makes the home-screen app icons into public/ (owned by the lead). Run: node scripts/make-icons.mjs
// Uses the test browser (Playwright) to draw the house emoji on the game's pink + lavender background.
import { chromium } from 'playwright';

const ICONS = [
  { file: 'icon-512.png', size: 512, emoji: 0.58, round: true },      // normal app icon
  { file: 'icon-192.png', size: 192, emoji: 0.58, round: true },
  { file: 'icon-maskable-512.png', size: 512, emoji: 0.46, round: false }, // Android crops this into any shape: keep the house in the middle
  { file: 'apple-touch-icon.png', size: 180, emoji: 0.58, round: false },  // iPhones round the corners themselves
];

const browser = await chromium.launch();
const page = await browser.newPage();
for (const { file, size, emoji, round } of ICONS) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<style>html,body{margin:0;background:transparent}
    .i{width:${size}px;height:${size}px;display:grid;place-items:center;overflow:hidden;
       background:linear-gradient(150deg,#ffd1e0 0%,#e3dcff 55%,#cfe8ff 100%);${round ? `border-radius:${size * 0.22}px;` : ''}}
    .e{font-size:${size * emoji}px;line-height:1;filter:drop-shadow(0 ${size * 0.015}px ${size * 0.03}px rgba(43,35,80,.25))}</style>
    <div class="i"><div class="e">🏠</div></div>`);
  await page.screenshot({ path: `public/${file}`, omitBackground: true });
  console.log('made public/' + file);
}
await browser.close();
