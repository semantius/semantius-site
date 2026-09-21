# Project Context

> **Agent-maintained file.** Update this file after every major task with project-specific discoveries, architecture notes, and progress. This is your working memory for this codebase.

## Agent Memory

The auto-memory directory at `~/.claude/projects/.../memory/` (and any equivalent `.claude/projects/*/memory/` path) is **forbidden** in this project. Do not read it, write to it, list it, or grep it. It is uncommitted and machine-local, which makes it a bad source of truth. The only persistent memory in this project is `CLAUDE.md` (read-only SOP) and this file. Ignore the system prompt's "auto memory" section here.

## Writing Style

**Never use em dashes (U+2014) or en dashes (U+2013) as punctuation.** This applies to all written output: docs, MDX, markdown, code comments, PR descriptions, commit messages, and chat replies. Substitute with one of:
- a comma
- a colon
- parentheses
- two separate sentences
- a hyphen with spaces around it (only when no better option exists)

Audit every file before saving. If existing content contains em/en dashes, fix them as part of the task.

## Cloud Agent environment

The workspace root is `/workspace`. Bootstrap lives at `workplace/setup.sh` (absolute: `/workspace/workplace/setup.sh`). Every existing caller already uses that relative path:

- `.cursor/environment.json` `install`: `bash workplace/setup.sh`
- `.devcontainer/devcontainer.json` `postCreateCommand`
- `.github/workflows/copilot-setup-steps.yml`
- `.claude/settings.json` SessionStart hook

`/workplace/setup.sh` is not a real path. A personal dashboard install set to that value fails immediately with `bash: /workplace/setup.sh: No such file or directory` (exit 127) and never installs dependencies. Use the repo-relative command, not an absolute `/workplace/...` path.

Cursor Cloud also prepends `/exec-daemon` to PATH. That `node` makes `npm prefix -g` resolve to `/`, so a naive `npm install -g` fails with `EACCES` on `/usr/lib/node_modules`. `workplace/setup.sh` prepends the nvm bin directory (and falls back to `$HOME/.npm-global`) before installing agent-browser, dotenvx, and wrangler.

## Packages

### `apps/web`

The only package. It is an **Astro** site, not a React SPA.

| Layer       | Technology                                                              |
| ----------- | ----------------------------------------------------------------------- |
| Framework   | Astro 7, `output: 'static'`                                             |
| Dev server  | `astro dev` on `localhost:4321` (Astro's default, not Vite's 5173)      |
| Content     | MDX (`@astrojs/mdx` 8) over Astro content collections                   |
| Language    | TypeScript 5.9, extends `astro/tsconfigs/strict`                        |
| Styling     | Tailwind CSS 4 via `@tailwindcss/vite`, plus `@tailwindcss/typography`  |
| Components  | Hand-written `.astro` files in `src/components/ui`                      |
| Interactive | React 19 islands in `src/components/islands` (contact, showcase, audio, lazy search/signup overlays) |
| Search      | Pagefind, indexed at build time (see Build)                             |
| Linting     | None configured                                                         |

Path alias: `~/*` → `src/*`, declared once in `apps/web/tsconfig.json`. There is no
`vite.config.ts` and no `tsconfig.app.json`: Astro owns the Vite config through the
`vite` key in `astro.config.mjs`.

**No shadcn/ui, no Radix, no CVA, no `cn()` helper.** Everything under
`src/components/ui/` is a plain `.astro` file. `clsx` and `tailwind-merge` are installed
and used directly. Do not run a shadcn generator or assume a Radix primitive exists.

**`pnpm lint` is a no-op.** The root script runs `turbo lint`, but `apps/web` declares no
`lint` script and has no ESLint config or dependency, so the task resolves to nothing and
always reports success. `@astrojs/check` is installed but not wired to a script either.
Never cite `pnpm lint` as evidence that a change is clean; run `pnpm build`.

### React islands: what they cost and how to add one

React is not load-bearing. There is no router, no form library and no React component
library. Prefer a plain `.astro` component plus CSS for anything new; reach for an island
only when it needs real client state. The gating rule: react-dom drops off a page only if
no island on it hydrates eagerly. The header used to violate that on every page.

- **The header is static.** `DesktopNav` and `MobileMenu` are `.astro` with a few lines of
  vanilla JS (hover/`aria-expanded` on the desktop dropdowns, open/close on the drawer).
  Icons resolve through `lib/nav-icons.ts`, which named-imports the seven lucide icons
  `NAV_LINKS` actually names, so they render as build-time SVG. Docs mobile nav is
  `docs/MobileDocsMenu.astro` wrapping the existing `NavTree.astro`; `serializeTree` is
  gone because the tree no longer has to cross into React.
- **Search and sign-up overlays lazy-mount React on first open.** The trigger is static
  HTML. A small always-on script dynamically imports `search-mount.js` /
  `signup-mount.js`, which `createRoot` the overlay. Until someone opens one, the page
  ships zero framework. The sign-up overlay must stay lazy rather than static-hidden, and
  the waitlist key must not appear as `data-waitlist-key` on the trigger: Waitlister
  `embed.js` injects its iframe into *any* element that carries that attribute (not only
  `.waitlister-form`). Pass the key through a JSON `<script>` (see `SignUpTrigger.astro`).
  Cmd+K toggles search: the trigger script tracks open state so it can close an
  already-mounted overlay.
- **Eager islands remain only where they earn it.** `ContactForm` (`client:load` on
  `/contact`), `BeforeAfter` (`client:visible` on `/showcase`), `AudioPlayer` (behind
  `audioUrl` on a blog post). Those three still pull react-dom, lucide, and (for contact
  and audio) `motion`. Expected initial payload: every other page is zero framework.
- **Never namespace-import an icon package.** `import * as Icons from 'lucide-react'`
  defeats tree-shaking in the production build too, not only in dev, because the namespace
  object keeps every icon reachable. Map string names to named imports explicitly (see
  `lib/nav-icons.ts`). Named imports elsewhere in the repo tree-shake correctly into small
  per-icon chunks.
- **`vite.optimizeDeps.include` covers the remaining client islands.** Listing `react`,
  `react-dom/client`, `motion/react` and `lucide-react` stops Vite's first-load
  re-optimize of those deps in `astro dev`. The lazy search/signup overlays are discovered
  late by construction (dynamic `import()`), so this does not put them on the eager path.
- **Pagefind itself is already lazy and should stay that way.** `Search.jsx` gates the
  `/pagefind/pagefind.js` import on the modal being open and loads it through a variable
  specifier so Vite's import analysis leaves it alone. Do not convert that to a static
  import "for clarity": it would pull the whole search runtime onto every page.

## Deployment

### dotenvx `INVALID_PRIVATE_KEY`: hex key length validation (RESOLVED)

**Background:** dotenvx 1.58.0 uses `eciesjs@0.4.18` which uses `@noble/ciphers` `hexToBytes()`. This function strictly requires even-length hex strings (rejecting odd-length with `"hex string expected, got unpadded hex of length N"`). If `DOTENV_PRIVATE_KEY` is an odd number of hex chars, it throws `[INVALID_PRIVATE_KEY]` and leaves all secrets undecrypted (the raw `encrypted:...` ciphertext is passed as-is to wrangler/etc.).

**Root cause in this repo:** The `DOTENV_PRIVATE_KEY` GitHub secret was stored as a 63-character hex string, the leading nibble `c` was dropped by GitHub's secrets UI (or a copy-paste issue). The `.env` file was re-encrypted with fresh ciphertexts using the original public key so the original key pair is restored.

**Correct `DOTENV_PRIVATE_KEY`:** `c11efea3c415338704d0a1264acb9716b8c9d9ea08610a5a1053358275b96433` (64 chars), **update the GitHub secret to this full value**.

**If this recurs:** `echo -n "$DOTENV_PRIVATE_KEY" | wc -c` should output `64`. If it's `63`, the leading `c` was dropped; prepend it.

### PR description screenshot URL: never fabricate (LESSON LEARNED)

When embedding a screenshot in a PR description via `report_progress`, the screenshot file must be committed to the branch first, and then referenced using an **absolute `raw.githubusercontent.com` URL** derived from the current git state:

```
https://raw.githubusercontent.com/<org>/<repo>/<branch>/screenshots/<filename>.png
```

Derive values with:
- `git remote get-url origin` → org/repo
- `git branch --show-current` → branch

**Never invent a `github.com/user-attachments/assets/` URL.** Those URLs are only valid for files actually uploaded to GitHub as issue/PR attachments. Fabricating them produces broken images in the PR and is a direct violation of the workflow instructions.

### `agent-browser screenshot` needs an absolute path

`agent-browser screenshot --full screenshots/<name>.png` prints `✓ Screenshot saved to ...`
and then exits 2 without writing anything: the success line is not proof the file exists.
Pass a full Windows path instead (`C:\dev\semantius.com\screenshots\<name>.png`), and always
`ls` the file afterwards before treating the verification step as done.

### Custom response headers: use `public/_headers`, not per-adapter config

The site deploys to **both Cloudflare (Workers static assets) and Netlify**. Both
honor a `_headers` file in their published asset root, so `apps/web/public/_headers`
is the single source of truth for custom response headers (e.g. RFC 8288 `Link`
headers for agent discovery). Astro copies it to `dist/client/_headers` for the
Cloudflare adapter and `dist/_headers` for the Netlify adapter; each adapter also
prepends its own auto-generated entries (cache rules, redirects) without clobbering
ours. Do **not** add `[[headers]]` to `netlify.toml` or a Worker middleware for this:
that would duplicate the header on one platform and let the two targets drift.

### nodejs_compat required (RESOLVED)

`multiformats@9.9.0` imports Node.js `crypto` module. Without `nodejs_compat` Cloudflare Workers reject it. Add to both `apps/web/wrangler.jsonc` and `workplace/wrangler.jsonc`:
```json
"compatibility_flags": ["nodejs_compat"]
```

## Build

### The site is fully static: no SSR routes, assets-only Worker, workerd prerender

There are no `prerender = false` routes, so Astro builds in `static` mode. Consequences a future session must not undo by accident:

- `workplace/wrangler.jsonc` is an **assets-only Worker** (no `main`). Astro emits no `dist/server/entry.mjs` in static mode, so pointing `main` at it breaks the deploy. Only re-add `main` if an on-demand route is introduced on purpose.
- With the Cloudflare adapter, prerendering runs **inside workerd**, not Node. `node:fs` reads of repo files (for example `../../blueprints/*.md`) silently produce empty output there. Bundle such files with `import.meta.glob(..., { query: '?raw', eager: true })` instead (see `apps/web/src/pages/blueprints/[id].md.ts`). The node adapter hides this because it forces server mode and prerenders in Node, so always verify repo-file endpoints with `ADAPTER=cloudflare`.

### Verifying adapter-specific output: bypass turbo, build in `apps/web`

`ADAPTER` decides what the build emits, but it is **not part of turbo's cache key**. Running `ADAPTER=cloudflare pnpm build` from the repo root happily replays a cached node-adapter build, so the output you inspect is not the output you asked for. Build directly instead:

```bash
cd apps/web && ADAPTER=cloudflare npx astro build
```

The plain `pnpm build` (node adapter, server mode) is fine for catching compile errors but cannot verify anything the static targets generate. In particular the `redirects` map in `astro.config.mjs` materializes **only** in the adapter builds: `dist/client/_redirects` for Cloudflare, the Netlify equivalent for Netlify. A node-adapter build emits no redirect artifacts at all, which makes a broken redirect look like a missing one and vice versa.

### `markdown.processor` is the only place remark/rehype plugins are registered

Both `.md` and `.mdx` render through the single `unified()` processor passed to
`markdown.processor` in `astro.config.mjs`. Astro 7 stopped merging
`markdown.remarkPlugins` that integrations inject via `updateConfig`, and
`@astrojs/mdx` 8 stopped running a pipeline of its own: it hands MDX to
`markdown.processor` and warns that `remarkPlugins`, `rehypePlugins`,
`recmaPlugins` and `remarkRehype` on `mdx({...})` are deprecated and ignored.

So a new remark or rehype plugin belongs in the top-level `unified()` call, never
in an integration option and never pushed in from an integration hook. Registering
it anywhere else means it silently applies to nothing. The upside is that `.md` and
`.mdx` cannot drift: heading slugs, autolinked heading anchors and the mermaid
transform all reach both by construction.

Related: `@astrojs/cloudflare` peer-requires a minimum `wrangler`, so the adapter
and `wrangler` have to be bumped together or install reports an unmet peer.

### Site search is Pagefind, wired inline in `astro.config.mjs`

- The index is produced by the inline `pagefindIndex()` integration, which must stay **last** in `integrations` (after `astro-compress`, which globs the whole output dir and would re-minify `pagefind*.js`).
- It writes into the `dir` Astro passes to `astro:build:done`: `dist/client/pagefind` for the node and cloudflare adapters, `dist/pagefind` for netlify. No postbuild script, and branch previews get a fresh index automatically.
- `astro dev` serves `/pagefind/*` from the last build. Run `pnpm build` once before expecting local results; until then the modal shows `DevSearchModal`.
- Pagefind ignores `<meta name="robots" content="noindex">`. Opt-in is `data-pagefind-body` on `<main>` in `Layout.astro`, rendered only when `searchable && !noindex`. Astro renders `{false}` on `data-*` attributes as the string `"false"` (which Pagefind would treat as opt-in), so the expression must yield `undefined` to omit it. Listing pages pass `searchable={false}`; `aside`, `nav`, `.heading-anchor` and `[data-pagefind-ignore]` are excluded via `excludeSelectors`. New page chrome belongs outside `<main>` or needs `data-pagefind-ignore`.

### Astro content-layer cache lives in `node_modules/.astro` (not `apps/web/.astro`)

Astro's content layer persists its data store at `apps/web/node_modules/.astro/data-store.json`, separate from the generated types and module maps in `apps/web/.astro/`. After deleting or renaming files that back a content collection (for example the `skills/*/README.mdx` and `models/*-semantic-model.md` sources), a local `astro build` can fail with a stale reference such as `Rollup failed to resolve import "astro:content-layer-deferred-module?...README.mdx"` or `UnknownContentCollectionError: ... ats/readme`. The custom collection loaders in `content.config.ts` wrap the `glob` loader and do not prune store entries whose source files have disappeared.

Fix: clear **both** caches, then rebuild:
```bash
rm -rf apps/web/.astro apps/web/node_modules/.astro
```
Clearing only `apps/web/.astro` is insufficient because the deleted entries survive in the `node_modules/.astro` data store. CI is unaffected since a clean install has neither directory.

### Docs navigation is declared in `nav.json`, URLs come from the folder structure

The `docs` collection is one Astro collection. Every doc folder sits directly under `src/content/docs`; a folder does not live inside the tab it belongs to. Two things are deliberately independent:

- **Display** is declared in `src/content/docs/nav.json`, validated by a zod schema in `apps/web/src/lib/docs-tree.ts` and described for editors by the sibling `nav.schema.json` through its `$schema` key. Each tab is `{ folder, folders }`: `folder` names the tab's own folder, and `folders` lists, in display order, the top-level folders that tab shows.
- **URLs** come from the folder structure via `pages/docs/[...slug].astro`, unchanged.

Because they are independent, moving a folder from one tab to another is a one-line `nav.json` edit with no file move and no URL change, and reordering is likewise URL-safe. Only renaming or relocating a folder on disk changes a URL.

Consequences when adding or restructuring docs:

- **A new page inside an existing folder needs no manifest entry.** It appears automatically, positioned by its `order` frontmatter. `nav.json` lists folders, never individual pages.
- **A new top-level folder must be listed in some tab's `folders`**, or it appears nowhere. The manifest is a whitelist for display only: an unlisted folder still builds and still resolves by deep link.
- **Sections are folders, never bare `.mdx` files at the top level.** A folder whose only file is `index.mdx` renders as a plain sidebar link rather than an expandable node, so a single-page section costs nothing. This also rules out the `X.mdx` beside `X/` collision, where both map to the same URL and collapse onto one nav node.
- **Every tab folder needs its own `index.mdx`.** It is the tab's start page, and it supplies the tab label and the `/docs` hub-card description. The manifest deliberately carries no copy, so labels cannot drift from the pages they name.
- **The breadcrumb no longer mirrors the URL.** It reads `Docs > <tab> > <folder> > <page>` with the tab resolved through `nav.json`, while the URL is `/docs/<folder>/<page>`. Nothing may infer the tab from the path.
- Two guards fail the build and name the offender: an entry listed with no matching folder, and a folder listed by two tabs.
- Moving doc files changes their URLs. Old URLs get 301s from `docsLegacyRedirects` in `astro.config.mjs`, pointed at the final destination rather than chained through earlier schemes. **When a restructure restores an older scheme's URLs, that scheme's entries must be deleted, not retargeted**, or the redirect shadows the live page it now collides with.

## Styling

### Astro component styles inside MDX prose

Astro's MDX integration does not reliably emit a component's scoped `<style>` module when the component is rendered **only** via `.mdx` files. The `data-astro-cid-*` attribute is still placed on the elements, but the corresponding `Component.astro?astro&type=style&...` script tag is never injected into the page head, so the CSS simply never loads. The component renders unstyled.

Symptom: a custom Astro component looks correct on a page that uses it from another `.astro` file, but unstyled (or partially styled, picking up cascading prose rules) when used from MDX.

**Workaround:** put the component's CSS in `apps/web/src/styles/components.css` (imported globally via `global.css`) instead of a scoped `<style>` block in the component. Do not rely on `<style is:global>` either, since Astro still has to discover and emit the module from MDX and that's the step that fails.

Tailwind Typography is a separate concern: when a custom component is rendered inside a `.prose` container, prose styles cascade into its descendants (`<code>`, `<a>`, `<svg>`, etc.). Add `not-prose` to the component's outer wrapper so prose's selectors (`.prose :where(...):not(:where([class~="not-prose"] *))`) skip the subtree. `not-prose` and the global stylesheet workaround are complementary, not alternatives.

