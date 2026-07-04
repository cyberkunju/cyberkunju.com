/**
 * Curated font registry for the homepage font switcher.
 *
 * Only the *selected* family is fetched (lazy <link> injection), so this list
 * costs nothing until a font is chosen. Sources are both free for commercial
 * use and self-hostable:
 *   - Fontshare (Indian Type Foundry) — premium foundry typefaces
 *   - Google Fonts — the distinctive, non-generic end of the catalogue
 *
 * This is an exploration tool for the design phase (the site is gated). Once a
 * family is locked in, self-host that single family, set it as --font-sans in
 * tokens.css, and retire this switcher + the external font origins.
 */

export type FontCategory = 'Sans' | 'Serif' | 'Display' | 'Mono';

export interface FontOption {
  readonly id: string;
  readonly name: string;
  /** Ready-to-use CSS font-family value (includes fallbacks). */
  readonly family: string;
  /** Stylesheet URL to lazy-load, or '' for the zero-byte system stack. */
  readonly href: string;
  readonly cat: FontCategory;
}

const SANS = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const SERIF = 'Georgia, Cambria, "Times New Roman", serif';
const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

const fam = (name: string, cat: FontCategory) =>
  `'${name}', ${cat === 'Serif' ? SERIF : cat === 'Mono' ? MONO : SANS}`;

/** Fontshare stylesheet URL for a family slug. */
const fs = (slug: string, w = '400,500,700') =>
  `https://api.fontshare.com/v2/css?f[]=${slug}@${w}&display=swap`;

/** Google Fonts stylesheet URL. Omit weights for single-weight display faces. */
const g = (family: string, w?: string) =>
  `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}${w ? `:wght@${w}` : ''}&display=swap`;

const F = (id: string, name: string, cat: FontCategory, href: string): FontOption => ({
  id,
  name,
  cat,
  href,
  family: fam(name, cat),
});

export const SYSTEM: FontOption = {
  id: 'system',
  name: 'System',
  cat: 'Sans',
  href: '',
  family: SANS,
};

/** Finalized brand typeface — the site default (also set in tokens.css). */
export const DEFAULT_FONT_ID = 'pally';

export const fonts: readonly FontOption[] = [
  SYSTEM,

  // — Fontshare: premium grotesques & sans —
  F('general-sans', 'General Sans', 'Sans', fs('general-sans')),
  F('satoshi', 'Satoshi', 'Sans', fs('satoshi')),
  F('cabinet-grotesk', 'Cabinet Grotesk', 'Sans', fs('cabinet-grotesk')),
  F('switzer', 'Switzer', 'Sans', fs('switzer')),
  F('clash-grotesk', 'Clash Grotesk', 'Sans', fs('clash-grotesk')),
  F('chillax', 'Chillax', 'Sans', fs('chillax')),
  F('supreme', 'Supreme', 'Sans', fs('supreme')),
  F('nippo', 'Nippo', 'Sans', fs('nippo')),
  F('pally', 'Pally', 'Sans', fs('pally')),
  F('ranade', 'Ranade', 'Sans', fs('ranade')),
  F('excon', 'Excon', 'Sans', fs('excon')),
  F('synonym', 'Synonym', 'Sans', fs('synonym')),
  F('quilon', 'Quilon', 'Sans', fs('quilon')),

  // — Fontshare: display —
  F('clash-display', 'Clash Display', 'Display', fs('clash-display')),
  F('panchang', 'Panchang', 'Display', fs('panchang')),
  F('stardom', 'Stardom', 'Display', fs('stardom')),
  F('tanker', 'Tanker', 'Display', fs('tanker')),
  F('comico', 'Comico', 'Display', fs('comico')),

  // — Fontshare: serif —
  F('sentient', 'Sentient', 'Serif', fs('sentient')),
  F('author', 'Author', 'Serif', fs('author')),
  F('zodiak', 'Zodiak', 'Serif', fs('zodiak')),
  F('boska', 'Boska', 'Serif', fs('boska')),
  F('gambetta', 'Gambetta', 'Serif', fs('gambetta')),
  F('erode', 'Erode', 'Serif', fs('erode')),
  F('rowan', 'Rowan', 'Serif', fs('rowan')),
  F('melodrama', 'Melodrama', 'Serif', fs('melodrama')),
  F('bespoke-serif', 'Bespoke Serif', 'Serif', fs('bespoke-serif')),
  F('bespoke-slab', 'Bespoke Slab', 'Serif', fs('bespoke-slab')),

  // — Google Fonts: distinctive sans & grotesque —
  F('space-grotesk', 'Space Grotesk', 'Sans', g('Space Grotesk', '400;500;700')),
  F('bricolage-grotesque', 'Bricolage Grotesque', 'Sans', g('Bricolage Grotesque', '400;500;700')),
  F('sora', 'Sora', 'Sans', g('Sora', '400;500;700')),
  F('familjen-grotesk', 'Familjen Grotesk', 'Sans', g('Familjen Grotesk', '400;500;700')),
  F('hanken-grotesk', 'Hanken Grotesk', 'Sans', g('Hanken Grotesk', '400;500;700')),
  F('schibsted-grotesk', 'Schibsted Grotesk', 'Sans', g('Schibsted Grotesk', '400;500;700')),
  F('gabarito', 'Gabarito', 'Sans', g('Gabarito', '400;500;700')),
  F('onest', 'Onest', 'Sans', g('Onest', '400;500;700')),
  F('geist', 'Geist', 'Sans', g('Geist', '400;500;700')),

  // — Google Fonts: editorial serif —
  F('fraunces', 'Fraunces', 'Serif', g('Fraunces', '400;500;700')),
  F('newsreader', 'Newsreader', 'Serif', g('Newsreader', '400;500;700')),
  F('spectral', 'Spectral', 'Serif', g('Spectral', '400;500;700')),
  F('instrument-serif', 'Instrument Serif', 'Serif', g('Instrument Serif')),
  F('dm-serif-display', 'DM Serif Display', 'Serif', g('DM Serif Display')),
  F('libre-caslon-text', 'Libre Caslon Text', 'Serif', g('Libre Caslon Text', '400;700')),
  F('cormorant-garamond', 'Cormorant Garamond', 'Serif', g('Cormorant Garamond', '400;500;700')),
  F('eb-garamond', 'EB Garamond', 'Serif', g('EB Garamond', '400;500;700')),
  F('playfair-display', 'Playfair Display', 'Serif', g('Playfair Display', '400;500;700')),

  // — Google Fonts: display —
  F('unbounded', 'Unbounded', 'Display', g('Unbounded', '400;500;700')),
  F('syne', 'Syne', 'Display', g('Syne', '400;500;700')),

  // — Mono —
  F('geist-mono', 'Geist Mono', 'Mono', g('Geist Mono', '400;500;700')),
  F('jetbrains-mono', 'JetBrains Mono', 'Mono', g('JetBrains Mono', '400;500;700')),
  F('ibm-plex-mono', 'IBM Plex Mono', 'Mono', g('IBM Plex Mono', '400;500;700')),
  F('space-mono', 'Space Mono', 'Mono', g('Space Mono', '400;700')),
];

export const DEFAULT_FONT: FontOption = fonts.find((f) => f.id === DEFAULT_FONT_ID) ?? SYSTEM;
