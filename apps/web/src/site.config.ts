import { SOLUTIONS } from '~/data/solutions';
import { SIGN_UP_URL } from '~/data/pricing';

export const siteConfig = {
  name: 'Semantius',
  // Site-wide fallback: used by any page that does not pass its own description,
  // and quoted verbatim by search results, link previews and AI answer engines.
  description: 'Define your domain model and deploy a governed PostgreSQL backend: REST APIs, an admin UI for your team, and guardrails for your agents. Open source, MIT licensed, self-hosted or managed.',
  logo: {
    src: '/semantius-logo.svg',
    srcDark: '/semantius-logo.svg',       // Used when strategy is 'switch'
    alt: 'Semantius Logo',
    strategy: 'static' as 'invert' | 'switch' | 'static', // 'invert' | 'switch' | 'static'
  },
  ogImage: '/og-image.webp',
  primaryColor: '#00008B', // Default primary color
  search: {
    enabled: true,
  },
  announcement: {
    enabled: true,
    id: 'public_beta_waitlist',
    link: '#signup',
    localizeLink: false,
  },
  blog: {
    postsPerPage: 6,
  },
  contact: {
    // One address for support, sales and privacy questions.
    email: 'hello@semantius.com',
    phone: {
      main: '+1 (555) 123-4567',
      label: 'Mon-Fri 9am-6pm PST'
    },
    address: {
      city: 'Endurance',
      full: 'Interstellar Space Station'
    }
  },
  analytics: {
    alwaysLoad: import.meta.env.ANALYTICS_ALWAYS_LOAD === 'true',
    vendors: {
      googleAnalytics: {
        id: import.meta.env.GA_ID || '',
        enabled: import.meta.env.GA_ENABLED === 'true',
      },
      rybbit: {
        id: import.meta.env.RYBBIT_ID || '',
        src: import.meta.env.RYBBIT_SRC || 'https://rybbit.example.com/api/script.js',
        enabled: import.meta.env.RYBBIT_ENABLED === 'true',
      },
      umami: {
        id: import.meta.env.UMAMI_ID || '',
        src: import.meta.env.UMAMI_SRC || 'https://analytics.umami.is/script.js',
        enabled: import.meta.env.UMAMI_ENABLED === 'true',
      },
    },
  },
  waitlister: {
    // Waitlister.me widget key: used to render the sign-up form in the modal.
    // Set WAITLISTER_KEY in your .env to enable it (data-waitlist-key value).
    waitlistKey: import.meta.env.WAITLISTER_KEY || '3-wGxQmqKCyY',
  },
  dateOptions: {
    localeMapping: {
      'ar': 'ar-TN', // Force Maghreb Arabic date format (e.g., جانفي instead of يناير)
      'en': 'en-US', // The site is American English: dates read "September 23, 2026"
    }
  }
};

export const NAV_LINKS = [
  {
    href: '/features',
    label: 'Product',
    children: [
      { href: '/features', label: 'Features', description: 'What makes us different', icon: 'Zap' },
      { href: '/pricing', label: 'Pricing', description: 'Cloud plans and self-hosting', icon: 'CreditCard' },
    ]
  },
  // The three landing pages under their reader labels (change request 1, §9).
  {
    href: SOLUTIONS.guardrails.path,
    label: 'Solutions',
    children: Object.values(SOLUTIONS).map((s) => ({ href: s.path, label: s.readerLabel })),
  },
  // Docs, Blog and Changelog only (v1 spec, §9).
  {
    href: '/docs',
    label: 'Resources',
    children: [
      { href: '/docs', label: 'Docs', description: 'Start building today', icon: 'Book', localize: false },
      { href: '/blog', label: 'Blog', description: 'Latest updates & guides', icon: 'Newspaper' },
      { href: '/changelog', label: 'Changelog', description: 'New features & fixes', icon: 'FileClock' },
    ]
  },
  // Company section temporarily hidden: restore when About/Contact pages are ready.
  // {
  //   href: '/about',
  //   label: 'Company',
  //   children: [
  //       { href: '/about', label: 'About', description: 'Our story & mission', icon: 'Building2' },
  //       { href: '/contact', label: 'Contact', description: 'Get in touch with us', icon: 'Mail' },
  //   ]
  // },
];

export const ACTION_LINKS = {
  // The mobile menu's Sign up: the same sign-up page as "Start free" (change request 1, §9).
  primary: { label: 'Sign up', href: SIGN_UP_URL },
  signIn: { label: 'Sign in', href: 'https://app.semantius.com/' },
  // Accounts Semantius actually owns. Every entry is published as the
  // Organization `sameAs` in Layout.astro, which tells search engines these
  // profiles are this company, so never add a placeholder here.
  social: {
    github: 'https://github.com/Semantius',
  } as Record<string, string>

};

export const FOOTER_LINKS = {
  product: {
    title: 'Product',
    links: [
      { href: '/features', label: 'Features' },
      { href: '/about', label: 'About' },
      { href: '/pricing', label: 'Pricing' },
      { href: '/changelog', label: 'Changelog' },
    ],
  },
  legal: {
    title: 'Legal',
    links: [
      { href: '/privacy', label: 'Privacy', localize: false },
      { href: '/terms', label: 'Terms', localize: false }
    ],
  },
};
