import { defineConfig, fontProviders } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import sitemap from "@astrojs/sitemap";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import cloudflare from "@astrojs/cloudflare";
import tailwindcss from '@tailwindcss/vite';
import compress from "astro-compress";
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sirv from 'sirv';
import matter from 'gray-matter';
import { markdownTwins } from './src/lib/dualmark/integration';
// Imported statically rather than with `await import('pagefind')` inside the
// astro:build:done hook. That dynamic import resolves through Vite's module
// runner, which can already be closed by the time trailing build hooks run,
// producing "Vite module runner has been closed".
import * as pagefind from 'pagefind';

/**
 * Remark plugin that injects a "Use <Skill>" heading and install command box
 * before the "## Semantic model" section in each skill README.mdx.
 * The injection happens in-memory during the remark AST transformation; the
 * source MDX files are never modified.
 */
function remarkSkillInstallCommand() {
    const COPY_SVG = '<svg class="command-icon-copy" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
    const CHECK_SVG = '<svg class="command-icon-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>';

    return function transformer(tree, vfile) {
        const filePath = vfile.path || (vfile.history && vfile.history[0]) || '';
        // Only apply to skill README files (e.g. .../skills/product-roadmap/README.mdx)
        const match = filePath.match(/skills[\\/]([\w-]+)[\\/]README\.mdx$/i);
        if (!match) return;

        const slug = match[1];
        const command = `npx skills add https://github.com/semantius/semantius/tree/main/skills/${slug}`;

        // Title: prefer frontmatter data set by Astro's remark pipeline; fall
        // back to parsing the raw file source, then to the slug.
        let title = slug;
        const fm = vfile.data && vfile.data.astro && vfile.data.astro.frontmatter;
        if (fm && fm.title) {
            title = fm.title;
        } else if (vfile.value) {
            const titleMatch = String(vfile.value).match(/^title:\s*(.+)$/m);
            if (titleMatch) title = titleMatch[1].replace(/^['"]|['"]$/g, '').trim();
        }

        // Locate the "## Semantic model" heading in the mdast
        let insertIndex = -1;
        for (let i = 0; i < tree.children.length; i++) {
            const node = tree.children[i];
            if (node.type === 'heading' && node.depth === 2) {
                const text = node.children
                    .filter(function (c) { return c.type === 'text'; })
                    .map(function (c) { return c.value; })
                    .join('');
                if (text === 'Semantic model') {
                    insertIndex = i;
                    break;
                }
            }
        }
        if (insertIndex === -1) return;

        // Build the command box as a raw HTML node so it uses the existing
        // .command CSS without importing the Command.astro component.
        const escapedCommand = command.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
        const commandHtml = `<div class="command not-prose group is-shell"><code class="command-text">${command}</code><button type="button" class="command-copy" data-command="${escapedCommand}" aria-label="Copy command">${COPY_SVG}${CHECK_SVG}<span class="command-copy-label">Copy</span></button></div>`;

        // Insert a "## Use <title>" heading (mdast node, so rehypeSlug +
        // rehypeAutolinkHeadings will process it normally) followed by the
        // raw HTML command box.
        tree.children.splice(insertIndex, 0,
            {
                type: 'heading',
                depth: 2,
                children: [{ type: 'text', value: 'Use ' + title }],
            },
            {
                type: 'html',
                value: commandHtml,
            }
        );
    };
}

/**
 * Remark plugin (used by the mermaid-enhanced integration below). Walks the
 * mdast tree and replaces code[lang=mermaid] nodes with raw HTML nodes. Node
 * value is inserted verbatim; no entity encoding.
 *
 * In Astro 7 the markdown pipeline moved to `markdown.processor: unified()`,
 * which no longer merges integration-injected `markdown.remarkPlugins`. So this
 * plugin is now registered directly in the top-level `unified()` call rather
 * than pushed in via the integration's `updateConfig`.
 */
function remarkMermaid() {
    return function transformer(tree) {
        function walk(node, parent, index) {
            if (
                node.type === 'code' &&
                node.lang === 'mermaid' &&
                parent !== null &&
                index >= 0
            ) {
                // Insert the raw mermaid source verbatim. No HTML-escaping
                // so < and > are preserved as-is for easy view-source
                // copy-paste. Content comes from repo .md files (developer-
                // controlled), not from user input, so no XSS risk here.
                parent.children[index] = {
                    type: 'html',
                    value: `<pre class="mermaid">${node.value}</pre>`,
                };
            } else if (node.children) {
                for (let i = 0; i < node.children.length; i++) {
                    walk(node.children[i], node, i);
                }
            }
        }
        walk(tree, null, -1);
    };
}

/**
 * Custom Astro integration that replaces astro-mermaid.
 * The mermaid -> <pre class="mermaid"> transform is handled by remarkMermaid
 * (registered in the top-level markdown processor). This integration adds the
 * client-side enhancement: pan/zoom and toolbar via @mostlylucid/mermaid-enhancements.
 */
function mermaidEnhanced() {
    return {
        name: 'mermaid-enhanced',
        hooks: {
            'astro:config:setup': ({ updateConfig, injectScript }) => {
                updateConfig({
                    vite: {
                        optimizeDeps: {
                            include: ['mermaid'],
                        },
                    },
                });

                // Client-side script: loads mermaid globally then initialises
                // @mostlylucid/mermaid-enhancements (pan/zoom, toolbar, theme).
                injectScript('page', `
const hasMermaid = () =>
    document.querySelectorAll('pre.mermaid, div.mermaid').length > 0;

async function initMermaidEnhanced() {
    if (!hasMermaid()) return;
    try {
        const [{ default: mermaid }, { init }] = await Promise.all([
            import('mermaid'),
            import('@mostlylucid/mermaid-enhancements'),
        ]);
        window.mermaid = mermaid;
        await init();
    } catch (err) {
        console.error('[mermaid-enhanced] Failed to initialise:', err);
    }
}

initMermaidEnhanced();
document.addEventListener('astro:after-swap', () => initMermaidEnhanced());
`);
            },
        },
    };
}

/**
 * Site search: builds the Pagefind index at build time and serves it in dev.
 *
 * - astro:build:done receives the directory Astro actually publishes
 *   (dist/client for the node and cloudflare adapters, dist for netlify), so
 *   the index lands next to the HTML for every deploy target without any
 *   postbuild script.
 * - Must be registered LAST in `integrations`: astro-compress globs the whole
 *   output dir in its own astro:build:done hook and would re-minify
 *   pagefind*.js if the index existed before it ran.
 * - `astro dev` has no build output of its own, so the dev middleware serves
 *   /pagefind/* from the last build. Run `pnpm build` once to get local
 *   results; until then Search.jsx shows the DevSearchModal fallback.
 * - Pagefind does NOT honour <meta name="robots" content="noindex">. Pages
 *   opt in via data-pagefind-body on <main> in Layout.astro, gated by
 *   `searchable && !noindex`. Once any page carries that attribute, pages
 *   without it are skipped entirely.
 */
function pagefindIndex() {
  let clientDir;
  return {
    name: 'pagefind-index',
    hooks: {
      'astro:config:setup': ({ config }) => {
        if (config.adapter) clientDir = fileURLToPath(config.build.client);
      },
      'astro:server:setup': ({ server }) => {
        const root = clientDir ?? path.join(server.config.root, server.config.build.outDir);
        const serve = sirv(root, { dev: true, etag: true });
        server.middlewares.use((req, res, next) =>
          req.url?.startsWith('/pagefind/') ? serve(req, res, next) : next());
      },
      'astro:build:done': async ({ dir, logger }) => {
        const out = fileURLToPath(dir);
        const { index, errors } = await pagefind.createIndex({
          // Sidebars, breadcrumbs, TOC, heading permalinks and anything marked
          // data-pagefind-ignore never reach the index.
          excludeSelectors: ['aside', 'nav', '.heading-anchor', '[data-pagefind-ignore]'],
        });
        if (!index) { logger.error(errors.join('\n')); return; }
        const { page_count } = await index.addDirectory({ path: out });
        await index.writeFiles({ outputPath: path.join(out, 'pagefind') });
        await pagefind.close();
        logger.info(`Pagefind indexed ${page_count} pages into ${path.join(out, 'pagefind')}`);
      },
    },
  };
}

/**
 * Appends the catch-all trailing-slash redirect, and appends it LAST.
 *
 * Why the rule exists: html_handling 'drop-trailing-slash' only redirects when
 * an asset actually exists at the slash-less path. Redirect-only routes have no
 * HTML file, so /models/ fell through to the 404 page instead of reaching the
 * /models -> /blueprints rule. This catches every slashed request, and issues a
 * cacheable 301 instead of html_handling's 307.
 *
 * Why it must be last, and why this is an integration rather than a line in
 * public/_redirects: Cloudflare allows 2,000 static redirect rules but only 100
 * dynamic (wildcard) ones, and it counts every rule FOLLOWING the first dynamic
 * rule as dynamic as well. Put this line at the top and a 112-rule file is
 * rejected at upload with "Maximum number of dynamic _redirects rules limit of
 * 100 exceeded". A public/_redirects file is copied in before the Cloudflare
 * adapter appends its generated rules, so it can only ever land first.
 * Static rules first, wildcard last, which is also the matching order we want.
 */
function trailingSlashRedirect() {
  // Spaces, not tabs: _redirects accepts either, and a tab here is invisible.
  const RULE = '/*/  /:splat  301';
  let clientDir;
  return {
    name: 'trailing-slash-redirect',
    hooks: {
      'astro:config:setup': ({ config }) => {
        if (config.adapter) clientDir = fileURLToPath(config.build.client);
      },
      'astro:build:done': ({ dir, logger }) => {
        const file = path.join(clientDir ?? fileURLToPath(dir), '_redirects');
        const existing = fs.existsSync(file)
          ? fs.readFileSync(file, 'utf8').replace(/\s*$/, '') + '\n'
          : '';
        fs.writeFileSync(file, existing + RULE + '\n');
        logger.info('catch-all trailing-slash rule appended to _redirects');
      },
    },
  };
}

// Helper to find noindex URLs
function getNoIndexUrls() {
  const urls = new Set();
  const contentDir = path.resolve('./src/content');
  const pagesDir = path.resolve('./src/pages');

  function scanDir(dir, callback) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        scanDir(fullPath, callback);
      } else {
        callback(fullPath);
      }
    }
  }

  // Scan Content Collections
  scanDir(contentDir, (filePath) => {
    if (filePath.endsWith('.md') || filePath.endsWith('.mdx')) {
      try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const { data } = matter(fileContent);
        if (data.noindex) {
          let relative = path.relative(contentDir, filePath);
          let urlPath = relative.replace(/\.(md|mdx)$/, '');
          urlPath = urlPath.replace(/\\/g, '/');
          // A folder's index.mdx is served at the bare folder URL (see the
          // docs route), so strip it or the noindex entry never matches.
          urlPath = urlPath.replace(/\/index$/, '');
          if (!urlPath.startsWith('/')) urlPath = '/' + urlPath;
          urls.add(urlPath);
          urls.add(urlPath + '/');
        }
      } catch (e) {
        console.warn(`Error parsing frontmatter for ${filePath}`, e);
      }
    }
  });

  // Scan Pages
  scanDir(pagesDir, (filePath) => {
    if (filePath.endsWith('.astro')) {
      const content = fs.readFileSync(filePath, 'utf-8');
      if (content.includes('noindex={true}')) {
        let relative = path.relative(pagesDir, filePath);
        let urlPath = relative.replace(/\.astro$/, '');
        urlPath = urlPath.replace(/\\/g, '/');

        if (urlPath.endsWith('/index')) {
          urlPath = urlPath.replace(/\/index$/, '') || '/';
        } else if (urlPath === 'index') {
          urlPath = '/';
        }

        if (!urlPath.startsWith('/')) urlPath = '/' + urlPath;
        urls.add(urlPath);
        urls.add(urlPath + '/');
      }
    }
  });

  return Array.from(urls);
}

const noIndexUrls = getNoIndexUrls();
console.log('Excluding URLs from sitemap:', noIndexUrls);

const DEFAULT_LOCALE = "en";

// Heading anchor links: appends a small chain icon after every heading; styled
// to fade in on hover (see apps/web/src/styles/typography.css .heading-anchor).
const autolinkHeadingsOptions = {
  behavior: 'append',
  properties: {
    className: ['heading-anchor'],
    ariaLabel: 'Permalink to this heading',
  },
  content: {
    type: 'element',
    tagName: 'svg',
    properties: {
      xmlns: 'http://www.w3.org/2000/svg',
      width: '14',
      height: '14',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: '2',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      ariaHidden: 'true',
    },
    children: [
      { type: 'element', tagName: 'path', properties: { d: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71' }, children: [] },
      { type: 'element', tagName: 'path', properties: { d: 'M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71' }, children: [] },
    ],
  },
};

import vercel from "@astrojs/vercel";
import netlify from "@astrojs/netlify";
import node from "@astrojs/node";
import process from "node:process";

// ... other imports

// Adapter selection strategy
function getAdapter() {
  const adapter = process.env.ADAPTER || 'cloudflare';

  switch (adapter) {
    case 'vercel':
      return vercel({
        webAnalytics: { enabled: true }
      });
    case 'netlify':
      return netlify();
    case 'cloudflare':
      return cloudflare({
        imageService: 'compile',
        platformProxy: {
          enabled: true,
        },
        runtime: {
          mode: 'advanced',
          type: 'worker',
          nodejsCompat: true,
        },
      });
    case 'node':
    default:
      return node({
        mode: 'standalone'
      });
  }
}

// Docs URLs have moved three times: flat -> nested folders -> grouped under a
// sub-collection (/docs/reference/...) -> back to top-level folders, now that
// tab membership is declared in content/docs/nav.json instead of being implied
// by the folder path. Every legacy URL points at its final destination rather
// than chaining through an intermediate scheme.
//
// Scheme 2 has no entries any more: the move back to top-level folders restored
// exactly those URLs, so they are live pages again and must not be redirected.
/**
 * Turn a map of HTML redirects into the same map for their markdown twins:
 *   "/docs/models-overview" -> "/docs/models"
 * becomes
 *   "/docs/models-overview.md" -> "/docs/models.md"
 *
 * Targets that are already a file (the blueprint source downloads) or external
 * are skipped, since they have no twin.
 */
function markdownRedirects(map) {
  const out = {};
  for (const [from, to] of Object.entries(map)) {
    if (typeof to !== 'string' || !to.startsWith('/') || /\.[a-z0-9]{2,4}$/i.test(to)) continue;
    out[`${from.replace(/\/$/, '')}.md`] = `${to.replace(/\/$/, '')}.md`;
  }
  return out;
}

const docsLegacyRedirects = {
  // Scheme 1: flat URLs, the only scheme before the nested-folder refactor.
  '/docs/models-overview': '/docs/models',
  '/docs/models-structure': '/docs/models/structure',
  '/docs/models-create': '/docs/models/create',
  '/docs/models-templates': '/docs/models/templates',
  '/docs/models-deploy': '/docs/models/deploy',
  '/docs/models-optimize': '/docs/models/optimize',
  '/docs/mcp-connectors-overview': '/docs/mcp-connectors',
  '/docs/mcp-connectors-installation': '/docs/mcp-connectors/installation',
  '/docs/agent-skills-overview': '/docs/agent-skills',
  '/docs/agent-skills-installation': '/docs/agent-skills/installation',
  '/docs/cli-overview': '/docs/cli',
  '/docs/cli-command': '/docs/cli/command',
  '/docs/cli-skill': '/docs/cli/use-semantius',
  '/docs/cli/skill': '/docs/cli/use-semantius',

  // Scheme 3: grouped under /docs/reference/. /docs/reference itself stays live
  // as the tab's start page, so it is deliberately absent here.
  '/docs/reference/overview': '/docs/overview',
  '/docs/reference/models': '/docs/models',
  '/docs/reference/models/structure': '/docs/models/structure',
  '/docs/reference/models/create': '/docs/models/create',
  '/docs/reference/models/templates': '/docs/models/templates',
  '/docs/reference/models/deploy': '/docs/models/deploy',
  '/docs/reference/models/optimize': '/docs/models/optimize',
  '/docs/reference/business-logic': '/docs/business-logic',
  '/docs/reference/business-logic/jsonlogic': '/docs/business-logic/jsonlogic',
  '/docs/reference/business-logic/extensions': '/docs/business-logic/extensions',
  '/docs/reference/mcp-connectors': '/docs/mcp-connectors',
  '/docs/reference/mcp-connectors/installation': '/docs/mcp-connectors/installation',
  '/docs/reference/agent-skills': '/docs/agent-skills',
  '/docs/reference/agent-skills/installation': '/docs/agent-skills/installation',
  '/docs/reference/cli': '/docs/cli',
  '/docs/reference/cli/command': '/docs/cli/command',
  '/docs/reference/cli/use-semantius': '/docs/cli/use-semantius',
};

// "Semantic models" were renamed to "semantic blueprints" and the whole
// /models/* route tree moved to /blueprints/*, which left /models a live 404.
// The catalog was rebuilt in the same change, so none of the old model slugs
// survive as blueprint slugs: every old page URL points at the catalog rather
// than at a per-slug destination that would only 301 into another 404. These
// are the twelve slugs the route served before it was removed (the `models/`
// directory as of commit 5728e3f^). A dynamic `[...slug]` catch-all is not an
// option: Astro rejects a redirect whose destination drops the source's params.
const legacyModelSlugs = [
  'apm', 'ats', 'cdp', 'cmdb', 'equipment_lease_management', 'itam',
  'itsm', 'nwind', 'product_roadmap', 'saas_expense_tracker',
  'workforce_planning', 'zero_based_budgeting',
];

const blueprintLegacyRedirects = {
  '/models': '/blueprints',
  ...Object.fromEntries(
    legacyModelSlugs.flatMap((slug) => [
      [`/models/${slug}`, '/blueprints'],
      [`/models/${slug}/model`, '/blueprints'],
    ]),
  ),
};

// https://astro.build/config
export default defineConfig({
  site: process.env.SITE_URL || 'https://www.semantius.com',
  output: 'static',
  // Canonical URLs carry no trailing slash. With build.format left at its
  // 'directory' default the output layout is unchanged (docs/cli/index.html);
  // only Astro.url.pathname changes, which is what the canonical, og:url and
  // the markdown twins are built from. Cloudflare's html_handling matches this
  // in workplace/wrangler.jsonc. Do NOT "simplify" this with
  // build.format: 'file' — that sets ending='.html' unconditionally and makes
  // the canonical /docs/cli.html.
  trailingSlash: 'never',
  redirects: {
    ...docsLegacyRedirects,
    ...blueprintLegacyRedirects,
    // Markdown twins of every legacy path. Without these, an agent that was
    // given an old URL and appends ".md" gets a 404, because Astro's redirects
    // only cover the HTML form. Derived from the same maps so the two can
    // never disagree about where a legacy path now lives.
    ...markdownRedirects({ ...docsLegacyRedirects, ...blueprintLegacyRedirects }),
  },
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Geist',
      cssVariable: '--font-geist',
      weights: [400, 500, 600, 700, 800],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['system-ui', 'sans-serif'],
    },
    {
      provider: fontProviders.google(),
      name: 'Geist Mono',
      cssVariable: '--font-geist-mono',
      weights: [400, 500, 600],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['ui-monospace', 'monospace'],
    },
  ],
  image: {
    service: { entrypoint: 'astro/assets/services/sharp' },
    domains: ['vitejs.dev', 'upload.wikimedia.org', 'astro.build', 'pagepro.co'],
  },
  adapter: getAdapter(),
  // Astro 7 defaults markdown to the Sätteri processor. We opt back into the
  // remark/rehype (unified) pipeline so the custom plugins below keep working.
  markdown: {
    processor: unified({
      remarkPlugins: [
        remarkSkillInstallCommand,
        remarkMermaid,
      ],
      rehypePlugins: [
        rehypeSlug,
        [rehypeAutolinkHeadings, autolinkHeadingsOptions],
      ],
    }),
  },
  integrations: [
    sitemap({
      filter: (page) => {
        const url = new URL(page);
        const pathname = url.pathname;
        return !noIndexUrls.includes(pathname);
      }
    }),
    react(),
    // @astrojs/mdx 8 delegates MDX processing to `markdown.processor`, so
    // MDX files inherit the remark/rehype plugins configured in the
    // `unified()` call above (rehypeSlug and rehypeAutolinkHeadings among
    // them). Passing `rehypePlugins` to `mdx()` is deprecated and ignored
    // as of mdx 8, and warns on every build.
    mdx(),
    mermaidEnhanced(),
    // CSS compression is left to Astro/Vite's native (lightningcss) minifier.
    // astro-compress must NOT touch CSS: its bundled csso minifier does not
    // understand the modern media-query range syntax Tailwind v4 emits
    // (`@media (width>=48rem)`) and silently DROPS those rules. Post Astro 7
    // the range syntax reaches astro-compress unconverted, so enabling its CSS
    // pass strips every responsive (sm:/md:/lg:/...) utility and collapses the
    // whole site to its mobile layout (desktop nav and multi-column grids gone).
    (await import("astro-compress")).default({ Image: false, JavaScript: true, HTML: false, CSS: false }),
    // Keep last (see pagefindIndex docblock).
    // Tier B markdown twins: extract from the rendered HTML of any page the
    // .md route did not already emit from source. Must run BEFORE
    // pagefindIndex(), which has to stay last; Pagefind globs **/*.html so the
    // .md files it writes are never indexed.
    // siteUrl is read from the resolved Astro config inside the integration,
    // not from process.env: Vite merges apps/web/.env (SITE_URL=localhost:4321)
    // into process.env after this file is evaluated.
    markdownTwins(),
    pagefindIndex(),
    trailingSlashRedirect(),
  ],
  vite: {
    plugins: [tailwindcss()],
    define: {
      'import.meta.env.DEFAULT_LOCALE': JSON.stringify(DEFAULT_LOCALE)
    },
    // Header islands are gone, but remaining React islands (ContactForm,
    // BeforeAfter, AudioPlayer) plus the lazy search/signup overlays are still
    // discovered late by Vite's dep scan on first load. Pre-bundling them
    // removes the re-optimize-and-reload stutter in `astro dev`.
    optimizeDeps: {
      include: ['react', 'react-dom/client', 'motion/react', 'lucide-react'],
    },
  },
});
