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

## Packages

### `apps/web`

| Layer       | Technology                                          |
| ----------- | --------------------------------------------------- |
| Framework   | React 19                                            |
| Language    | TypeScript 5.9                                      |
| Build / Dev | Vite 7 (HMR on `localhost:5173`)                    |
| Styling     | Tailwind CSS 4                                      |
| Components  | shadcn/ui (Radix primitives + CVA + `cn()` utility) |
| Linting     | ESLint 9                                            |

Path alias: `@` → `apps/web/src` (configured in `vite.config.ts` and `tsconfig.app.json`).

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

### Docs sub-collections are top-level folders under `src/content/docs`

The `docs` collection is one Astro collection, but the nav treats each top-level folder (`guide/`, `reference/`) as a separate sub-collection, surfaced as the tab bar above the docs columns. The registry is `DOCS_COLLECTIONS` in `apps/web/src/lib/docs-tree.ts` (slug, label, description); adding a collection means adding a folder plus one row there, and the `/docs` hub grows a card for it automatically. Nothing else is parameterised: routes (`pages/docs/[...slug].astro`) and nav paths (`buildDocsTree`) both derive from the folder structure, so the URL and the tree stay in sync by construction.

Consequences when adding docs:

- A page placed directly under `src/content/docs/` sits outside every collection: it still gets a route, but no tab shows it and the sidebar falls back to `DEFAULT_DOCS_COLLECTION`. New pages belong inside a collection folder.
- **Every collection needs its own `index.mdx` start page.** The tab and the breadcrumb both link to it, and the hierarchy is `/docs` (hub with collection cards) → `/docs/<collection>` (start page) → pages. Without one, `getDocsCollectionNavs` falls back to the collection's first page and the collection root 404s.
- Sidebar, prev/next and the breadcrumb section all run off the active collection's subtree, so navigation never crosses collections. The breadcrumb mirrors the URL (`Docs › Reference › Models › Create a Model`) and drops any level that is the current page, so it never links to the page you are on.
- Moving doc files changes their URLs. Old URLs get 301s from `docsLegacyRedirects` in `astro.config.mjs`, pointed at the final destination rather than chained through earlier schemes.

## Styling

### Astro component styles inside MDX prose

Astro's MDX integration does not reliably emit a component's scoped `<style>` module when the component is rendered **only** via `.mdx` files. The `data-astro-cid-*` attribute is still placed on the elements, but the corresponding `Component.astro?astro&type=style&...` script tag is never injected into the page head, so the CSS simply never loads. The component renders unstyled.

Symptom: a custom Astro component looks correct on a page that uses it from another `.astro` file, but unstyled (or partially styled, picking up cascading prose rules) when used from MDX.

**Workaround:** put the component's CSS in `apps/web/src/styles/components.css` (imported globally via `global.css`) instead of a scoped `<style>` block in the component. Do not rely on `<style is:global>` either, since Astro still has to discover and emit the module from MDX and that's the step that fails.

Tailwind Typography is a separate concern: when a custom component is rendered inside a `.prose` container, prose styles cascade into its descendants (`<code>`, `<a>`, `<svg>`, etc.). Add `not-prose` to the component's outer wrapper so prose's selectors (`.prose :where(...):not(:where([class~="not-prose"] *))`) skip the subtree. `not-prose` and the global stylesheet workaround are complementary, not alternatives.

