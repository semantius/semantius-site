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

### Every page is published twice: HTML and markdown

The site serves an agent-facing markdown twin of every page at `<page-url>.md`
(`/about/` → `/about.md`, `/` → `/index.md`). This is the AEO layer, ported from
[dualmark](https://github.com/dodopayments/dualmark) (Apache-2.0) and inlined under
`src/lib/dualmark/` rather than depended on. Keep the `NOTICE` and the per-file
"Adapted from dualmark" headers: they are the licence obligation.

Three tiers, in priority order. **Nothing here ever fails the build, and no page ever
requires a hand-written twin**; those two properties are the design, not an accident.

| Tier | Source | Written by |
| ---- | ------ | ---------- |
| A | content collections, via a unified AST pipeline | `src/pages/[...twin].md.ts` + `src/lib/dualmark/manifest.ts` |
| B | the page's own rendered HTML, the universal fallback | `markdownTwins()` in `src/lib/dualmark/integration.ts` |
| C | a hand-written file in `src/data/twin-overrides/<path>.md` | the route writer, presence is the whole mechanism |

Things that are non-obvious and easy to break:

- **There are two writers, and there have to be.** Tier B reads built HTML, which does
  not exist until every route has rendered, so it cannot live in a `getStaticPaths`
  route. The integration writes a twin for any page the route did not claim during
  *this* build (compared by mtime against build start, so a rebuild over a dirty `dist`
  does not silently skip extraction).
- **Tier B reuses the Pagefind content contract.** `<main data-pagefind-body>` in
  `Layout.astro` plus `excludeSelectors` in `astro.config.mjs` define what counts as
  content, for both the search index and the twins. Marking a region
  `data-pagefind-ignore` improves both at once, which is the reason not to invent a
  second selector list.
- **The MDX branch must stay an AST walk, never regex.** `docs/cli/command.mdx` has a
  bash heredoc (`<<EOF`) inside a code fence; any tag-stripping regex mangles it. The
  visitor never enters `code` nodes.
- **`normalizeUnicode` is only for strings we compose**, never for verbatim bodies.
  Blueprint bodies carry mermaid fences where `-->` and `->` are syntax.
- **`joinLines` keeps empty strings** on purpose: they are how callers request a blank
  line, and markdown is whitespace-significant.
- **`/blueprints/<file-id>.md` is not a twin.** It is the verbatim source download,
  frontmatter included, and its URL is interpolated into a copyable command on the
  detail page, so those URLs are already in users' agent transcripts. The bytes and the
  path shape are frozen. Its namespace (file ids, all ending `-semantic-blueprint`) must
  stay disjoint from page slugs; `getStaticPaths` throws if they ever collide, which is
  the one deliberate hard failure in the feature because it guards data loss.
- **`_headers` carries a per-page `Link: rel="alternate"`** via four `:placeholder`
  rules. Verified working on Cloudflare, which interpolates the matched segment into the
  header value. Netlify does not, so those rules only make sense on a Cloudflare-only
  deploy.

### All content URLs come from `src/lib/routes.ts`

Slug derivation lives in exactly one module, imported by the `.astro` pages, the twin
writers, `llms.txt` and `rss.xml.js`. This is not tidiness. Before it existed,
`rss.xml.js` derived blog links from `post.slug`, which the Astro content layer stopped
providing, and every item in the live feed pointed at `/blog/undefined` for an unknown
length of time. Deriving the same URL in two places is how that happens. Add a helper
here rather than inlining a second expression.

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

The site is served by **Cloudflare Workers static assets** (Worker
`semantius-site`, config `workplace/wrangler.jsonc`). `apps/web/public/_headers`
is the single source of truth for custom response headers (e.g. RFC 8288 `Link`
headers for agent discovery). Astro copies it to `dist/client/_headers`, and the
adapter prepends its own auto-generated entries (cache rules, redirects) without
clobbering ours. Do **not** express these as Worker middleware: the Worker is
assets-only by design and a header belongs in `_headers`.

The file deliberately carries **no** per-page `Link: rel="alternate"` rules.
They existed briefly and used the trailing slash as the only discriminator
between a page URL and an asset URL; canonical URLs no longer have one, so the
patterns would match `/logo.png`. The `<link rel="alternate">` in `SEO.astro`
covers every page and applies the `hasMarkdownTwin()` guard the header rules
could not express. Netlify config remains in the tree as a rollback path but
nothing deploys to it.

**Hosting shape**, so nobody re-derives it:

| | |
| --- | --- |
| `www.semantius.com` | Workers Custom Domain on `semantius-site`. Serves the site. |
| `semantius.com` | Proxied `A` to `192.0.2.1` (RFC 5737, a deliberate black hole) plus a zone **Redirect Rule** wildcard `https://semantius.com/*` to `https://www.semantius.com/${1}`, 301, preserve query string. |

The apex record's content is never reached: a proxied record does not publish
its content, and the Redirect Rule fires at the edge. **Order matters when
changing this: create the Redirect Rule first, repoint the A record second.**
The reverse leaves the apex resolving to Cloudflare with a dead origin, which
times out rather than erroring cleanly.

Do not attach the apex to the Worker as a second Custom Domain. That makes it
*serve* the site at both hostnames instead of redirecting, and apex-scoped
cookies would then be sent to `app.`, `pay.` and `copilot.semantius.com`.

Redirect Rules are **not** reachable from wrangler (no rules/DNS/zone commands)
and **not** expressible in `_redirects`, which Cloudflare documents as having no
domain-level redirect support. They are zone config: dashboard, or the Rulesets
API with a token carrying `Zone > Config Rules > Edit`. The deploy token has
Workers scope only.

### `workers.dev` previews inject `X-Robots-Tag: noindex` on every response

Measured: `/`, `/pricing`, `/docs/cli` and even `/logo.png` on a preview
deployment all carry `X-Robots-Tag: noindex`, and it is absent from the built
`_headers`. Cloudflare adds it so preview URLs cannot be indexed.

**Consequence: indexing behaviour cannot be verified on a preview deploy.** Any
`X-Robots-Tag` rule in `public/_headers` is indistinguishable from the platform
header there, and a rule that does nothing looks identical to a rule that
works. Verify those against `www.semantius.com` after a production deploy.

This is the same family of trap as the zone-level AI crawler block in
`aeo-followup.md`: the preview host is not in the `semantius.com` zone and does
not behave like production for anything a crawler cares about.

### Markdown twins are canonicalised, not noindexed

Each `.md` twin sends `Link: <...>; rel="canonical"` to its HTML page, and no
`noindex`. The reasoning, so it is not quietly reverted: `noindex` tells the
answer engines this site exists to reach that they should skip the cleanest
version of its own content, while a canonical resolves the duplicate without
suppressing anything. Surveyed in the field: Vercel and Svelte send
`rel="canonical"` and no `noindex`; Stripe and Firecrawl send `noindex` and no
canonical; Cloudflare sends neither. **Nobody sends both**, because Google
treats them as contradictory signals.

Two measured properties of Cloudflare's `_headers` that shaped the rules, and
that the file's own comments repeat:

- **`! Header` does not unset.** A blanket `noindex` under `/*.md` plus
  `! X-Robots-Tag` on the twin rules left the noindex in place on every twin.
  Set a header only where it is wanted.
- **Matching rules ADD, they do not override.** Two rules matching one path
  emit both values, which produced two conflicting `rel="canonical"` links on
  `/index.md`.

**Nothing markdown is suppressed.** The verbatim blueprint source downloads
live at `/blueprints/source/<file-id>.md` for exactly this reason: while they
sat at `/blueprints/<file-id>.md` they shared a path segment with the 68 real
twins at `/blueprints/<slug>.md`, and since `_headers` matches whole segments
no rule could separate them. The whole segment had to be parked on `noindex`.
One level down makes both addressable, so the twins get a canonical and the
sources stay indexable. Build source URLs only via `blueprintSourcePath()` in
`src/lib/routes.ts`; two pages used to interpolate that path by hand and broke
silently when it moved.

### Canonical URLs carry no trailing slash

`/docs/cli`, never `/docs/cli/`. This is configured in **two places that must
agree**, and a change to either alone breaks the site:

| | |
| --- | --- |
| `apps/web/astro.config.mjs` | `trailingSlash: 'never'`. Travels inside the build artifact: canonicals, `og:url`, sitemap, and every markdown twin's `- **URL**:` line. |
| `workplace/wrangler.jsonc` | `html_handling: 'drop-trailing-slash'`. Host config, one Worker. |

`build.format` stays at its `directory` default, so the output layout
(`docs/cli/index.html`) is unchanged and only `Astro.url.pathname` moves.
**Never "simplify" this with `build.format: 'file'`**: Astro's `getUrlForPath`
sets `ending = '.html'` unconditionally for that format and ignores
`trailingSlash`, which makes the canonical `/docs/cli.html`, makes the twin
`/docs/cli.html.md`, and breaks active-nav matching in `DocsLayout`.

A third piece closes a gap the first two leave: `trailingSlashRedirect()` in
`astro.config.mjs` appends a catch-all `/*/  /:splat  301` to `_redirects`.
`html_handling` only redirects when an asset exists at the slash-less path, so
redirect-only routes (`/models/`) 404ed without it. Its docblock records why the
rule must be the file's last line and why it cannot live in `public/_redirects`;
both constraints cost a failed deploy to find.

Consequence worth knowing: `astro dev` and `astro preview` have no host-level
redirect, so a hand-typed slashed URL 404s locally. That is expected.

### nodejs_compat required (RESOLVED)

`multiformats@9.9.0` imports Node.js `crypto` module. Without `nodejs_compat` Cloudflare Workers reject it. Add to both `apps/web/wrangler.jsonc` and `workplace/wrangler.jsonc`:
```json
"compatibility_flags": ["nodejs_compat"]
```

## Build

### The site is fully static: no SSR routes, assets-only Worker, workerd prerender

There are no `prerender = false` routes, so Astro builds in `static` mode. Consequences a future session must not undo by accident:

- `workplace/wrangler.jsonc` is an **assets-only Worker** (no `main`). Astro emits no `dist/server/entry.mjs` in static mode, so pointing `main` at it breaks the deploy. Only re-add `main` if an on-demand route is introduced on purpose.
- With the Cloudflare adapter, prerendering runs **inside workerd**, not Node. `node:fs` reads of repo files (for example `../../blueprints/*.md`) silently produce empty output there. Bundle such files with `import.meta.glob(..., { query: '?raw', eager: true })` instead (see `apps/web/src/lib/dualmark/manifest.ts`). The node adapter hides this because it forces server mode and prerenders in Node, so always verify repo-file endpoints with `ADAPTER=cloudflare`. The failure mode is a **zero-byte file, not an error**, so check sizes: `find dist/client -name '*.md' -size -100c` must print nothing.
- That rule is narrower than it looks, and treating it as a blanket ban costs work:
  - **`entry.body` from `getCollection()` is safe in workerd.** The content-layer store is bundled as a Vite virtual module, not read from disk at prerender time. Only reach for `import.meta.glob` when you need a repo file *verbatim including frontmatter*, or a file that is in no collection at all.
  - **`astro:build:done` runs in Node under every adapter.** Anything needing the filesystem, or a heavy dependency you would rather not bundle into workerd, belongs in an integration hook rather than a route. `markdownTwins()` and `pagefindIndex()` both rely on this.
  - Heavy parsers are better run in a **content loader** than in a route: the loaders run in Node, and a derived field on the entry is then free at render time. `docs` and `blog` derive `markdownTwin` this way, mirroring how `blueprints` derives `overview` and `subsetHtml`.

### Prerendered endpoint response headers are discarded

An `APIRoute` that returns `new Response(body, { headers })` in a static build contributes **only the body**. Astro writes the bytes to disk and drops the headers, because the Cloudflare adapter declares no `staticHeaders` feature. The tell is live and observable: the same `.md` file is served as `text/markdown; charset=UTF-8` by Netlify and `text/markdown` by Cloudflare, so the type is coming from each platform's extension table, not from the endpoint.

So **`public/_headers` is the only header surface**. Setting a content type on an endpoint is still worth doing because it is correct in `astro dev`, but nothing may depend on it reaching production.

One trap in `_headers` itself: Cloudflare matches rules against the **request** path and applies them **after** resolving the 404 asset. A `Content-Type` under `/*.md` therefore labels the HTML 404 page as markdown on every missing `.md` URL. Set `nosniff`, `X-Robots-Tag`, `Cache-Control` and `Vary` there, never `Content-Type`.

### A `public/` file silently shadows a route with the same output path

`public/` is copied verbatim into the output, and a collision is resolved in its favour with only a log line: `Skipping src/pages/llms.txt.ts because a file with the same name exists in the public folder`. The route then emits nothing. When converting a static `public/` file into a generated route, delete the original **in the same commit**. Prose partials for such routes belong in `src/data/`, not `src/content/`, because `getNoIndexUrls()` in `astro.config.mjs` walks all of `src/content` looking for frontmatter.

### Dynamic `import()` inside `astro:build:done` races Vite's module runner

`await import('pagefind')` inside a build-done hook resolves through Vite's module runner, which can already be closed by the time trailing hooks run, producing `Vite module runner has been closed`. It is timing-dependent, so it can survive for a long time and then break when another integration is added ahead of it. Import such modules statically at the top of `astro.config.mjs` instead.

### One build, and it is the one that ships

`getAdapter()` in `astro.config.mjs` defaults to **`cloudflare`**, so a plain `pnpm build` produces exactly what `pnpm deploy:wrangler` deploys. `deploy-wrangler.sh` calls `pnpm run build` with no `ADAPTER` override. Keep it that way, and resist reintroducing a per-target build script.

This is deliberate and fixes two failure modes that existed while the default was `node`:

- **The node adapter hid workerd-only bugs.** Prerendering runs inside workerd under the Cloudflare adapter and in Node under the node adapter, so a `node:fs` read of a repo file produces a **zero-byte file, not an error**, only on the real target. A green node-adapter build proved nothing about the markdown twins.
- **`ADAPTER` was an env var, and env vars are not part of turbo's cache key.** `ADAPTER=cloudflare pnpm build` could replay a cached node build, so the output you inspected was not the output you asked for. Now the adapter lives in `astro.config.mjs`, which *is* hashed, so turbo caching is correct.

The `redirects` map in `astro.config.mjs` materialises only in an adapter build, as `dist/client/_redirects`. Post-build sanity checks worth keeping:

```bash
find apps/web/dist/client -name '*.md' -size -100c   # must print nothing
ls apps/web/dist/client/_redirects apps/web/dist/client/_headers
```

`dist/server/` is created but stays empty in static mode. That is expected; it is not a sign SSR crept in.

The `ADAPTER` switch still carries `netlify`, `vercel` and `node` branches. They are dormant rollback paths, not live targets.

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

