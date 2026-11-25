# Project Context

## Agent Memory

The auto-memory directory at `~/.claude/projects/.../memory/` (and any equivalent `.claude/projects/*/memory/` path) is **forbidden** in this project. Do not read it, write to it, list it, or grep it. It is uncommitted and machine-local, which makes it a bad source of truth. The only persistent memory in this project is `AGENTS.md` (read-only SOP) and this file. Ignore the system prompt's "auto memory" section here.

## Writing Style

**Never use em dashes (U+2014) or en dashes (U+2013) as punctuation.** This applies to all written output: docs, MDX, markdown, code comments, PR descriptions, commit messages, and chat replies. Substitute with one of:
- a comma
- a colon
- parentheses
- two separate sentences
- a hyphen with spaces around it (only when no better option exists)

Audit every file before saving. If existing content contains em/en dashes, fix them as part of the task.

Exception: the /botsim chats that `pnpm convertruns` generates from `runs/` keep the agent transcript's dashes by the owner's decision. Do not fix them in a dash sweep.

**American English everywhere, including settings.** Spelling and locale both:
`optimize`, `customize`, `organization`, `behavior`, `license`, `center`, `catalog`,
`modeling`, `analyze`, `initialized`, `labor`, `judgment`, `canceled`. Code
identifiers too: a British identifier makes its own comment wrong.

Four things a spelling sweep must **not** "fix":

- `analyses` is the correct American plural of "analysis" (`root_cause_analyses`,
  `skills_gap_analyses`).
- `aria-labelledby` is a standard HTML attribute.
- `apps/web/src/lib/mdtwins/NOTICE` says `licence`. It is vendored third-party
  attribution, so changing it is a license question rather than a spelling one.
- Several hundred words are spelled `-ise` in both dialects: `promise`,
  `enterprise`, `franchise`, `otherwise`, `improvise`, `surprising`, `exercising`.
  A naive `-ise` regex hits every one of them, so always filter before editing.

**Self-hosted docs are variant-aware.** The `semantius-self-hosted` repo generates
several variants (`local-semantius-idp`, `local-entra-idp`, `dokploy-semantius-idp`)
from one template, and the pages are written for `local-semantius-idp`. Every page
under `self-hosted/` therefore opens with a bold lead-in naming the variants it
covers, and `variants.mdx` holds the page-by-variant table. Keep both in step when
adding a page or a section that only one variant has (anything under `/idp` or
`/gateway` is semantius-idp's). Operator changes go in `.env` or
`docker-compose.override.yml`, never in generated variant files: `git pull` and
`./build.sh` would conflict with or overwrite them.

**Docs pages have no `<h1>` in the body:** `DocsLayout` renders it from `title`. It
also lists every heading twice, in the table of contents beside the article at `xl`
and inline above it, so keep headings short. There is no admonition component.

**A docs page's `description` never appears on the page.** `DocsLayout` passes it only to the meta tags, but it is the page's summary in site search, `llms.txt`, the markdown twin and, for a tab's `index.mdx`, the `/docs` hub card. When an edit changes what a page covers or how its opening describes it, update the description in the same edit.

**Never pipe doc content through a Bash heredoc into a Python string when it holds
a backslash line continuation.** The `\` plus newline arrives collapsed, leaving
one long line with triple spaces. Use Write or Edit for such content.

## Working rules

**Name the root cause, not only the fix.** When a change works around a structural
problem instead of removing it, say so in the hand-back and the commit message, name
the structural problem, and list the other places it affects.

**Redirects are the owner's decision.** When pages are moved, redirects might be
needed, but whether one is needed and what type is not for an agent to decide: always
ask.

**Nothing is committed before the owner has reviewed it.** When a preview deploy needs
a commit first (AGENTS.md, Verification Workflow), stop and ask instead: the owner
reviews the uncommitted changes, and the commit and deploy happen only after the owner
says so.

## Working from the founder's page specifications

**Stop and ask; never infer.** This is the founder's standing instruction. When a
spec leaves anything open (a title, a label, a link target, a section, a rendering
detail) or two of its rules conflict, ask before building. Do not write your own
copy, and do not remove content the spec does not name, however good the reason.
List everything you asked about in the hand-back.

- **Use the spec's copy word for word.**
- **Decided content is built, never a placeholder.** If the spec gives the copy,
  the link target or the artifact, it goes on the page. An empty placeholder
  where the content was decided is a failure.
- **Content that is not defined yet gets a visible TBD** (`components/common/Tbd.astro`)
  whose note says exactly what is missing, for example "No docs page exists
  yet." Never hide an element, leave out a section or drop a link because its
  content does not exist yet. A TBD stays until its content exists, and every
  TBD is listed in the spec's TBD file. A spec rule against placeholders never
  removes a TBD for undefined content: flag such a rule as a contradiction.
- **A spec's TBD list and its numbered list of deviations, each with its reason,**
  are markdown files at the repo root. The home page's are `home-tbd.md` and
  `home-deviations.md`.

## Content that does not originate in this repo

`blueprints/`, `skill-specs/` and `skills/` are **mirrors**. They are generated and
maintained elsewhere and merely checked in here, so do not edit them in this repo:
the next sync overwrites the change, and a spelling or wording fix applied here is
lost silently. `skills/use-<x>/spec.json` is byte identical to
`skill-specs/<X>/spec.json`, which is the clearest tell.

That also rules them out of any site-wide prose pass. They carry British spellings
and model identifiers such as `retail_labour_schedules`, and both have to be fixed
upstream. A table or enum name in a blueprint is a published data model besides, so
renaming one is a breaking change for anybody who already deployed it rather than a
typo fix.

## Cloud Agent environment

The workspace root is `/workspace`. Bootstrap lives at `workplace/setup.sh` (absolute: `/workspace/workplace/setup.sh`). Every existing caller already uses that relative path:

- `.cursor/environment.json` `install`: `bash workplace/setup.sh`
- `.devcontainer/devcontainer.json` `postCreateCommand`
- `.github/workflows/copilot-setup-steps.yml`
- `.claude/settings.json` SessionStart hook

`/workplace/setup.sh` is not a real path. A personal dashboard install set to that value fails immediately with `bash: /workplace/setup.sh: No such file or directory` (exit 127) and never installs dependencies. Use the repo-relative command, not an absolute `/workplace/...` path.

## Packages

### `apps/web`

The only package. It is an **Astro** site, not a React SPA. Its dev server is
`astro dev` on `localhost:4321` (Astro's default, not Vite's 5173).

**No shadcn/ui, no Radix, no CVA, no `cn()` helper.** Everything under
`src/components/ui/` is a plain `.astro` file. `clsx` and `tailwind-merge` are installed
and used directly. Do not run a shadcn generator or assume a Radix primitive exists.

**`pnpm lint` is a no-op.** The root script runs `turbo lint`, but `apps/web` declares no
`lint` script and has no ESLint config or dependency, so the task resolves to nothing and
always reports success. `@astrojs/check` is installed but not wired to a script either.
Never cite `pnpm lint` as evidence that a change is clean; run `pnpm build`.

### Every page is published twice: HTML and markdown

Each page has a markdown twin at `<page-url>.md`. Every twin is converted from the
page's built HTML after the build, never re-rendered from source or collection data,
because a second renderer of the same page drifts. All twin code is in
`apps/web/src/lib/mdtwins/`, whose README is the reference. When a twin is wrong, fix
the page markup or a generic rule in `extract.ts`, never twin text in code. A
hand-written override in `mdtwins/overrides/` is the only exception.

- Keep the `NOTICE` and the per-file "Adapted from dualmark" headers: they are the
  license obligation.

### All content URLs come from `src/lib/routes.ts`

Slug derivation lives in exactly one module; its header explains why. Add a helper
there rather than inlining a second expression.

### React islands

- **Never namespace-import an icon package.** `import * as Icons from 'lucide-react'`
  defeats tree-shaking in the production build too, not only in dev, because the namespace
  object keeps every icon reachable. Map string names to named imports explicitly (see
  `lib/nav-icons.ts`).

## Deployment

### Deploy from Git Bash, not PowerShell

Run `pnpm preview:wrangler` from Git Bash, not PowerShell: in PowerShell `bash`
resolves to WSL's `bash.exe`, which does not inherit Windows environment variables, so
`deploy-wrangler.sh` reports `CLOUDFLARE_API_TOKEN is not set` although dotenvx
decrypted it.

### `agent-browser screenshot` needs an absolute path

`agent-browser screenshot --full screenshots/<name>.png` prints `✓ Screenshot saved to ...`
and then exits 2 without writing anything: the success line is not proof the file exists.
Pass a full path with forward slashes instead (`C:/dev/semantius.com/screenshots/<name>.png`),
and always `ls` the file afterwards before treating the verification step as done. Backslashes
break in the Bash tool: in `"C:\\dev\\...\\$TS-name.png"` the `\$` escapes the variable, and
the file lands in the repo root named literally `screenshots$TS-name.png`.

Its **default viewport is 1243 CSS px wide**, below Tailwind's `xl` (1280px),
so a default screenshot lands in the band where the docs' right-hand column is
not rendered. Set `agent-browser set viewport 1600 1000` before screenshotting
anything whose layout depends on `xl:`.

Worth knowing for the breakpoint itself: Chrome evaluates a `min-width` media
query against the viewport **including** the classic scrollbar, while layout
gets the narrower box. Measured at a 1280px window: `innerWidth` 1280,
`clientWidth` 1265, `matchMedia('(min-width: 1280px)')` true. So a scrollbar
never costs you a breakpoint, and a component that appears at `xl` really does
appear on a 1280px screen.

### A `DOTENV_PRIVATE_KEY` must be 64 hex characters

dotenvx rejects a key with an odd number of hex characters (`[INVALID_PRIVATE_KEY]`)
and then passes the still-encrypted `encrypted:...` values on instead of failing.
Check the length with `echo -n "$DOTENV_PRIVATE_KEY" | wc -c`.

### Custom response headers: use `public/_headers`, not per-adapter config

The site is served by **Cloudflare Workers static assets** (Worker
`semantius-site`, config `workplace/wrangler.jsonc`). `apps/web/public/_headers`
is the single source of truth for custom response headers (e.g. RFC 8288 `Link`
headers for agent discovery). Astro copies it to `dist/client/_headers`, and the
adapter prepends its own auto-generated entries (cache rules, redirects) without
clobbering ours. Do **not** express these as Worker middleware: the Worker is
assets-only by design and a header belongs in `_headers`.

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

**Consequence: indexing behavior cannot be verified on a preview deploy.** Any
`X-Robots-Tag` rule in `public/_headers` is indistinguishable from the platform
header there, and a rule that does nothing looks identical to a rule that
works. Verify those against `www.semantius.com` after a production deploy.

The preview host is not in the `semantius.com` zone and does not behave like
production for anything a crawler cares about.

## Build

### The site is fully static: no SSR routes, workerd prerender

There are no `prerender = false` routes, so Astro builds in `static` mode. Consequences a future session must not undo by accident:

- With the Cloudflare adapter, prerendering runs **inside workerd**, not Node. `node:fs` reads of repo files (for example a file outside `src/`) silently produce empty output there. Bundle such files with `import.meta.glob(..., { query: '?raw', eager: true })` instead. The node adapter hides this because it forces server mode and prerenders in Node, so always verify repo-file endpoints with `ADAPTER=cloudflare`. The failure mode is a **zero-byte file, not an error**, so check sizes: `find dist/client -name '*.md' -size -100c` must print nothing.
- That rule is narrower than it looks, and treating it as a blanket ban costs work:
  - **`entry.body` from `getCollection()` is safe in workerd.** The content-layer store is bundled as a Vite virtual module, not read from disk at prerender time. Only reach for `import.meta.glob` when you need a repo file *verbatim including frontmatter*, or a file that is in no collection at all.
  - **`astro:build:done` runs in Node under every adapter.** Anything needing the filesystem, or a heavy dependency you would rather not bundle into workerd, belongs in an integration hook rather than a route. `markdownTwins()` and `pagefindIndex()` both rely on this.
  - Heavy parsers are better run in a **content loader** than in a route: the loaders run in Node, and a derived field on the entry is then free at render time. The `skills` loader derives `skillBody` this way.

### Prerendered endpoint response headers are discarded

An `APIRoute` that returns `new Response(body, { headers })` in a static build contributes **only the body**. Astro writes the bytes to disk and drops the headers, because the Cloudflare adapter declares no `staticHeaders` feature. The tell is live and observable: the same `.md` file is served as `text/markdown; charset=UTF-8` by Netlify and `text/markdown` by Cloudflare, so the type is coming from each platform's extension table, not from the endpoint.

So **`public/_headers` is the only header surface**. Setting a content type on an endpoint is still worth doing because it is correct in `astro dev`, but nothing may depend on it reaching production.

### A `public/` file silently shadows a route with the same output path

`public/` is copied verbatim into the output, and a collision is resolved in its favor with only a log line: `Skipping src/pages/llms.txt.ts because a file with the same name exists in the public folder`. The route then emits nothing. When converting a static `public/` file into a generated route, delete the original **in the same commit**. Prose partials for such routes belong in `src/data/`, not `src/content/`, because `getNoIndexUrls()` in `astro.config.mjs` walks all of `src/content` looking for frontmatter.

### One build, and it is the one that ships

`getAdapter()` in `astro.config.mjs` defaults to **`cloudflare`**, so a plain `pnpm build` produces exactly what `pnpm deploy:wrangler` deploys. `deploy-wrangler.sh` calls `pnpm run build` with no `ADAPTER` override.

`ADAPTER` can still override the default from the environment, but it is not part of turbo's cache key, so `ADAPTER=<x> pnpm build` can replay a cached build made with another adapter.

Page redirects are listed in `apps/web/redirects.jsonc`. `loadRedirects()` in `astro.config.mjs` reads them, and `withTwinRedirects()` in `src/lib/mdtwins/redirects.ts` adds each one's markdown twin redirect. They materialize only in an adapter build, as `dist/client/_redirects`. Post-build sanity checks worth keeping:

```bash
find apps/web/dist/client -name '*.md' -size -100c   # must print nothing
ls apps/web/dist/client/_redirects apps/web/dist/client/_headers
```

`dist/server/` is created but stays empty in static mode. That is expected; it is not a sign SSR crept in.

The `ADAPTER` switch still carries `netlify`, `vercel` and `node` branches. They are dormant rollback paths, not live targets.

### Bump `@astrojs/cloudflare` and `wrangler` together

`@astrojs/cloudflare` peer-requires a minimum `wrangler`, so the adapter and
`wrangler` have to be bumped together or install reports an unmet peer.

### Build-time env vars: one key, one file

Values reach `import.meta.env` through two channels: `apps/web/.env` (gitignored,
dev machines only) and the process env, which `dotenvx run --` fills from the
committed, encrypted root `.env`. Where a key exists in both, the precedence is
measured, and it is the **opposite** of Vite's documented `loadEnv` behavior,
where `process.env` wins:

- **Key present in `apps/web/.env` → that file wins.** Building with
  `PUBLIC_POSTHOG_PROJECT_TOKEN` set only in the process env put it in 0 of 190
  pages.
- **Key absent from it → the process env is used.** The same build with the file
  moved aside inlined the process-env value into 177 pages.

The consequence is a silent one in both directions: a var that lives only in the
untracked file disappears from CI builds with no error (the page just ships
without that snippet), and a stale copy in that file quietly masks the committed
value on a dev machine.

So each key lives in exactly **one** of the two. Anything a CI build needs goes in
the root `.env` via `dotenvx set KEY value` and is then deliberately absent from
`apps/web/.env`. That is why the PostHog pair is not in the app-level file.
`apps/web/.env` keeps only what is genuinely local (`SITE_URL`, `ADAPTER`).
`SITE_URL` needs nothing in CI: `astro.config.mjs` falls back to
`https://www.semantius.com`.

Encrypting the `PUBLIC_*` analytics values buys tidiness, not secrecy: they are
inlined into every page's HTML by `PostHog.astro` and are public by design.

### Astro content-layer cache lives in `node_modules/.astro` (not `apps/web/.astro`)

Astro's content layer persists its data store at `apps/web/node_modules/.astro/data-store.json`, separate from the generated types and module maps in `apps/web/.astro/`. After deleting or renaming files that back a content collection (for example the `skills/*/README.mdx` sources), a local `astro build` can fail with a stale reference such as `Rollup failed to resolve import "astro:content-layer-deferred-module?...README.mdx"` or `UnknownContentCollectionError: ... ats/readme`. The custom collection loaders in `content.config.ts` wrap the `glob` loader and do not prune store entries whose source files have disappeared.

Fix: clear **both** caches, then rebuild:
```bash
rm -rf apps/web/.astro apps/web/node_modules/.astro
```
Clearing only `apps/web/.astro` is insufficient because the deleted entries survive in the `node_modules/.astro` data store. CI is unaffected since a clean install has neither directory.

### Docs navigation is declared in `nav.json`, URLs come from the folder structure

`src/lib/docs-tree.ts` documents the model. When adding or restructuring docs:

- **A new page inside an existing folder needs no manifest entry.** It appears automatically, positioned by its `order` frontmatter. `nav.json` lists folders, never individual pages.
- **A new top-level folder must be listed in some tab's `folders`**, or it appears nowhere.
- **Sections are folders, never bare `.mdx` files at the top level.** A folder whose only file is `index.mdx` renders as a plain sidebar link rather than an expandable node, so a single-page section costs nothing. This also rules out the `X.mdx` beside `X/` collision, where both map to the same URL and collapse onto one nav node.
- **Every tab folder needs its own `index.mdx`.** It is the tab's start page, and it supplies the tab label and the `/docs` hub-card description. The manifest deliberately carries no copy, so labels cannot drift from the pages they name.
- **The breadcrumb no longer mirrors the URL.** It reads `Docs > <tab> > <folder> > <page>` with the tab resolved through `nav.json`, while the URL is `/docs/<folder>/<page>`. Nothing may infer the tab from the path. That includes the JSON-LD `BreadcrumbList`: docs pages pass it explicitly.
- Moving doc files changes their URLs. A redirect whose source path becomes a live page again shadows that page.

## Styling

### Astro component styles inside MDX prose

Astro's MDX integration does not reliably emit a component's scoped `<style>` module when the component is rendered **only** via `.mdx` files. The `data-astro-cid-*` attribute is still placed on the elements, but the corresponding `Component.astro?astro&type=style&...` script tag is never injected into the page head, so the CSS simply never loads. The component renders unstyled.

Symptom: a custom Astro component looks correct on a page that uses it from another `.astro` file, but unstyled (or partially styled, picking up cascading prose rules) when used from MDX.

**Workaround:** put the component's CSS in `apps/web/src/styles/components.css` (imported globally via `global.css`) instead of a scoped `<style>` block in the component. Do not rely on `<style is:global>` either, since Astro still has to discover and emit the module from MDX and that's the step that fails.

### `sr-only` text inside a scroll box needs a positioned wrapper

`sr-only` is `position: absolute`. Inside an `overflow-x-auto` table wrapper that
is not itself positioned, those spans take the root as their containing block,
escape the scroll box and widen the whole page. Give every scroll
wrapper `relative`. The tell is `document.documentElement.scrollWidth` exceeding
the viewport while `body` and `main` report no overflow.

Tailwind Typography is a separate concern: when a custom component is rendered inside a `.prose` container, prose styles cascade into its descendants (`<code>`, `<a>`, `<svg>`, etc.). Add `not-prose` to the component's outer wrapper so prose's selectors (`.prose :where(...):not(:where([class~="not-prose"] *))`) skip the subtree. `not-prose` and the global stylesheet workaround are complementary, not alternatives.
