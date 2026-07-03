/**
 * Single source of truth for site-wide identity, navigation, and the data
 * used to generate SEO tags and JSON-LD structured data.
 *
 * TODO(owner): replace the placeholder identity fields with your real details.
 */

export interface SocialLink {
  readonly label: string;
  readonly href: string;
  /** Used in JSON-LD `sameAs` for entity disambiguation. */
  readonly sameAs: boolean;
}

export interface NavItem {
  readonly label: string;
  readonly href: string;
}

export interface SiteConfig {
  readonly name: string;
  readonly handle: string;
  readonly title: string;
  readonly description: string;
  readonly url: string;
  readonly locale: string;
  readonly jobTitle: string;
  readonly email: string;
  readonly nav: readonly NavItem[];
  readonly social: readonly SocialLink[];
}

export const site: SiteConfig = {
  name: 'Your Name', // TODO(owner)
  handle: 'cyberkunju',
  title: 'Your Name — Software Engineer',
  description: 'Portfolio and engineering notes. Systems, performance, and the work behind them.',
  url: 'https://www.cyberkunju.com', // keep in sync with astro.config.mjs `site`
  locale: 'en',
  jobTitle: 'Software Engineer',
  email: 'hello@cyberkunju.dev', // TODO(owner)
  nav: [
    { label: 'Work', href: '/projects' },
    { label: 'About', href: '/about' },
  ],
  social: [
    { label: 'GitHub', href: 'https://github.com/cyberkunju', sameAs: true },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/cyberkunju', sameAs: true },
  ],
} as const;
