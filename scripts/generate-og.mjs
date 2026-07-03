/*
 * Generates the default Open Graph card at public/og-default.png (1200x630).
 * Regenerate after changing identity: `bun run og`.
 *
 * Keep the text below in sync with src/config/site.ts. This is a deliberately
 * tiny duplication — wiring the TS config into a build script isn't worth the
 * complexity for three strings.
 */
import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';

const NAME = 'Navaneeth K';
const TITLE = 'Software Engineer';
const DOMAIN = 'www.cyberkunju.com';

const W = 1200;
const H = 630;

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#0b0c0f"/>
  <rect x="0" y="0" width="${W}" height="10" fill="#2f5eff"/>
  <g font-family="sans-serif" fill="#e9ebf0">
    <text x="80" y="150" font-size="30" letter-spacing="4" fill="#9aa2b1">${esc(TITLE.toUpperCase())}</text>
    <text x="80" y="330" font-size="112" font-weight="700">${esc(NAME)}</text>
    <text x="80" y="410" font-size="34" fill="#9aa2b1">Systems · performance · the work behind them.</text>
    <text x="80" y="560" font-size="28" fill="#7f9cff">${esc(DOMAIN)}</text>
  </g>
</svg>`;

await mkdir('public', { recursive: true });
await sharp(Buffer.from(svg)).png().toFile('public/og-default.png');
const meta = await sharp('public/og-default.png').metadata();
console.log(`og-default.png ${meta.width}x${meta.height} (${meta.format})`);
