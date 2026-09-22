# AEO: next session

Three pieces of work, in strict order. Each is a prerequisite for the next.

| | | |
|---|---|---|
| **0** | Cloudflare cutover | **Done.** `www` on the Worker, apex redirect live, Netlify out of the request path. |
| **0b** | Remove Netlify from the codebase | Gated, deliberately not done. It is the rollback path. |
| **B** | Remove the trailing slash | **Next. Fresh session.** |
| **A** | Markdown and copy actions in the docs header | After B. B changes URL shape, A builds UI that embeds URLs. |

Background on the markdown twins is in `CONTEXT-MEMORY.md` under "Every page is
published twice: HTML and markdown". Open items from that work are in
`aeo-followup.md`. This file does not repeat either.

Anything below marked **verified** was measured against the live site or read
out of dependency source during planning, not recalled. Re-verify anything that
is not marked.

---

# 0. Cloudflare cutover

## Why this is a prerequisite and not a risk row

Plan B splits across two layers that live in different places:

- `trailingSlash: 'never'` is baked into the build output. It rewrites the
  canonical in 189 HTML files, plus `og:url`, plus every twin's `- **URL**:`
  line. It travels inside the artifact, so it lands on whatever host you deploy
  to.
- `html_handling` is host config. It configures one Cloudflare Worker and
  nothing else.

Deploy that artifact to Netlify and every page asserts a canonical URL that
Netlify 301s away from. For an AEO project that is worse than the current state.

**Netlify cannot be made to agree.** Its docs say plainly: "You cannot use a
redirect rule to add or remove a trailing slash." The only lever is the Pretty
URLs toggle, and disabling it makes Netlify serve both `/blog.html` and `/blog`,
duplicating every page; Netlify's own support guide advises against it. The
behaviour is driven by **file layout**, not config: `blog/index.html` gives
`/blog` 301 to `/blog/`, and only `blog.html` gives a 200 on `/blog`. Astro
emits the first, and the `build.format` trap in section B rules out the second.

## State at the time of writing (verified)

**The domain is already fully on Cloudflare. No domain migration is needed.**

```
semantius.com NS  ->  cris.ns.cloudflare.com, paityn.ns.cloudflare.com
```

DNS records in the zone. Only the two marked below are in scope; leave the rest
alone, they belong to other services.

| Name | Type | Content | Proxy | Action |
|---|---|---|---|---|
| `semantius.com` | A | `75.2.60.5` (Netlify apex) | Proxied | **Edit to `192.0.2.1`** |
| `www.semantius.com` | CNAME | `semantius.netlify.app` | Proxied | **Delete** |
| `app.semantius.com` | CNAME | `...vercel-dns-016.com` | Proxied | Leave |
| `pay.semantius.com` | CNAME | `paylinks.commerce.godaddy.com` | Proxied | Leave |
| `_domainconnect.semantius.com` | CNAME | `_domainconnect.gd.domaincontrol.com` | Proxied | Leave |
| `send.semantius.com` | MX | `feedback-smtp.us-east-1.amazonses.com` | DNS only | Leave |

Both site hostnames are proxied, which is why responses carry `CF-RAY` and
`x-nf-request-id` together: Cloudflare is the CDN, Netlify is the origin. That
is a different product from Cloudflare Workers static assets, which is what
`workplace/wrangler.jsonc` configures and what serves the `.workers.dev`
previews.

Measured behaviour on both targets:

```
                      PRODUCTION (Netlify)      PREVIEW (CF Workers)
/pricing              301 -> /pricing/          307 -> /pricing/
/pricing/             200                       200
/pricing.html         301 -> /pricing/          307 -> /pricing/
/pricing/index.html   200  (duplicate URL)      307 -> /pricing/
```

Apex traffic pays twice today: `semantius.com/pricing` 301s to
`www.semantius.com/pricing`, which 301s again to `/pricing/`.

## Production and previews share one config (verified)

`workplace/deploy-wrangler.sh` runs
`wrangler deploy --config workplace/wrangler.jsonc` for both preview and
`--prod`, against the same Worker name `semantius-site`. Two consequences:

- `html_handling` goes in exactly one file.
- A preview test of `drop-trailing-slash` is a **true rehearsal** of production,
  not an approximation.

`apps/web/wrangler.jsonc` has no `assets` block and is not referenced by the
deploy script. It looks dead.

## Done. Final state, measured

```
semantius.com/pricing       301 -> www.semantius.com/pricing     (Redirect Rule)
www.semantius.com/pricing   307 -> www.semantius.com/pricing/    (Worker, section B removes this hop)
                            200
```

Query strings survive the apex hop. No `x-nf-request-id` on any `www` response,
so Netlify is out of the request path. DNS now reads:

| Name | Type | Content | Proxy |
|---|---|---|---|
| `semantius.com` | A | `192.0.2.1` | Proxied |
| `www.semantius.com` | Worker | `semantius-site` | Proxied |

Plus untouched: `app` (Vercel), `pay` and `_domainconnect` (GoDaddy), `copilot`
(Worker), `send` MX and the TXT records (SES, DMARC, SPF).

> **Two things cost time. Do not repeat them.**
>
> 1. **Create the Redirect Rule *before* repointing the apex `A` record.** Doing
>    it in the other order leaves the apex resolving to Cloudflare with a dead
>    origin, which **times out** rather than failing cleanly. The plan originally
>    listed these in the wrong order.
> 2. **Redirect Rules live under the domain, not the Worker**, and `Rules` sits
>    *below* `Caching` in the zone sidebar, usually under the fold. Deep link:
>    `dash.cloudflare.com/<account>/semantius.com/rules/redirect-rules/new`.
>    Do not use any of the three offered templates: "WWW to root" is backwards,
>    and "Redirect to a different domain" matches `www` too and loops.

Neither wrangler nor `_redirects` can create this rule. Wrangler has no
rules/DNS/zone commands, and Cloudflare documents `_redirects` as having no
domain-level redirect support. It is zone config: dashboard, or the Rulesets API
with a token carrying `Zone > Config Rules > Edit`. The deploy token is Workers
scope only.

## What was done: Cloudflare dashboard

- [x] **DNS: delete `www.semantius.com CNAME semantius.netlify.app`.**

      Workers Custom Domains create and own the DNS record for their hostname,
      and refuse to clobber one they did not create. That is all
      `Hostname 'www.semantius.com' already has externally managed DNS records`
      means. It is not a sign the domain is off Cloudflare.

- [ ] Workers, `semantius-site`, Domains & Routes, add Custom Domain
      `www.semantius.com`. Confirm a new Workers-managed `www` record appears.

- [ ] **DNS: edit the apex `A` record from `75.2.60.5` to `192.0.2.1`, keeping
      it proxied. Do not delete it.** Deleting leaves the apex with no record,
      so there is nothing proxied for the Redirect Rule to fire on and
      `semantius.com` NXDOMAINs.

      The apex already resolves to Cloudflare and will continue to. **A proxied
      record never publishes its content.** The world is served Cloudflare's
      anycast IPs (`104.21.x.x`, `172.67.x.x`), and the content field is only
      the origin Cloudflare would dial if a request ever got that far. It never
      does, because the Redirect Rule fires at the edge. `192.0.2.1` is RFC 5737
      reserved documentation space, chosen so it can never accidentally be a
      real host.

      Do not attach the apex to the Worker as a second Custom Domain instead.
      That would make it *serve* the site at both hostnames rather than redirect,
      which is the duplicate-content problem you are avoiding. Keeping Workers
      off the apex also means rule-versus-Worker execution order never has to be
      reasoned about.

- [ ] Rules, Redirect Rules, new single redirect:

      | | |
      |---|---|
      | Match | wildcard `https://semantius.com/*` |
      | Target | `https://www.semantius.com/${1}` |
      | Status | `301` |
      | Preserve query string | enabled |

      Single Redirects are available on all plans including Free, and require
      the hostname to be proxied.

- [ ] While in the dashboard, check the AI crawler block for the zone. `GPTBot`
      and `ClaudeBot` were 403 at planning time (item 2 in `aeo-followup.md`).
      Record the decision in `CONTEXT-MEMORY.md` so nobody quietly reverts it.

**Zero-downtime alternative to the first two items:** add a Worker Route instead
of a Custom Domain. Routes attach to an existing proxied hostname without
touching DNS:

```jsonc
// workplace/wrangler.jsonc
"routes": [
  { "pattern": "www.semantius.com/*", "zone_name": "semantius.com" }
]
```

The Netlify CNAME stays, the Worker intercepts in front of it, and since the
Worker is assets-only and serves everything, Netlify never gets a request.
Instantly reversible. The downside is a DNS record left pointing at a Netlify
project you are about to delete, so convert to a Custom Domain afterwards.

## Checklist: code

> **Netlify stays in the codebase through the cutover. It is the rollback path.**
> While `netlify.toml`, `workplace/deploy-netlify.sh`, the `ADAPTER=netlify`
> branch and the `@astrojs/netlify` dependency are all still present, recovering
> from a bad cutover is one `pnpm deploy:netlify` plus a DNS revert. Removing
> them first buys nothing and costs exactly that. Removal is section 0b, gated
> on the cutover being verified and stable.

**Done: one build, and it is the one that ships.** The default adapter is now
`cloudflare`, not `node`, so `pnpm build` produces exactly what
`pnpm deploy:wrangler` deploys.

| File | Change |
|---|---|
| `astro.config.mjs` | `process.env.ADAPTER \|\| 'cloudflare'` |
| `apps/web/package.json` | dropped `build:wrangler` (now identical to `build`) |
| root `package.json` | dropped `build:cloudflare` (was a silent no-op, same trap as `pnpm lint`) |
| `turbo.json` | dropped the `build:cloudflare` task |
| `deploy-wrangler.sh` | `ADAPTER=cloudflare pnpm run build` becomes `pnpm run build` |

Why it matters, beyond tidiness: prerendering runs in **workerd** under the
Cloudflare adapter and in **Node** under the node adapter, and a `node:fs` read
of a repo file yields a **zero-byte file, not an error**, only on the real
target. A green node-adapter build proved nothing about the markdown twins.
Separately, `ADAPTER` was an env var and env vars are not in turbo's cache key,
so `ADAPTER=cloudflare pnpm build` could replay a cached node build. The adapter
now lives in a hashed config file, so turbo caching is correct and the "bypass
turbo, build in `apps/web`" workaround is retired.

Verified after the change: `176 markdown twins (137 from source, 39 extracted)`,
232 `.md`, 190 `.html`, `_headers` and `_redirects` both emitted, no zero-byte
twins, `dist/server/` empty as expected in static mode. `astro preview` still
works under the Cloudflare adapter, so the `preview` script needed no change.

- [ ] **Commit before deploying.** Deploys can crash the agent and uncommitted
      work is lost.
- [ ] `pnpm deploy:wrangler` to ship the build-script change. Not urgent: it
      produces byte-identical output to the previous `ADAPTER=cloudflare` path,
      so the live site is already correct.

Do **not** delete `apps/web/wrangler.jsonc`. An earlier draft of this plan called
it dead. It is not: the Astro Cloudflare adapter reads it (`platformProxy` is
enabled in `astro.config.mjs`) and the build writes a resolved copy to
`dist/client/wrangler.json` naming it as the `configPath`.

---

# 0b. Remove Netlify

**Gated. Only after the cutover is verified and has run stable long enough that
you would not roll back.** Everything here is recoverable from git, but keeping
it in the tree keeps the rollback to a single command.

- [ ] Delete `apps/web/netlify.toml` and `workplace/deploy-netlify.sh`
- [ ] Remove `build:netlify` and `deploy:netlify` from the root and `apps/web`
      `package.json`
- [ ] Remove the `deploy:netlify` and `build:netlify` tasks from `turbo.json`
- [ ] Remove the `case 'netlify'` branch and the `@astrojs/netlify` import from
      `astro.config.mjs`, and drop the dependency
- [ ] Delete the Netlify project itself **last**, after all of the above. Until
      it is deleted, `pnpm deploy:netlify` from an earlier commit remains a
      working escape hatch.

## Checklist: verify

```bash
for u in https://semantius.com/docs/cli \
         "https://semantius.com/pricing?a=1" \
         https://www.semantius.com/docs/cli/; do
  printf '%-44s ' "$u"
  curl -sS -o /dev/null -w '%{http_code} -> %{redirect_url}\n' "$u"
done

# want no output: Netlify is no longer in the request path
curl -sSI https://www.semantius.com/docs/cli/ | grep -i 'x-nf-request-id'
```

---

# B. Remove the trailing slash

> **Run this in a new session, once section 0 is complete and verified.**
> It is safe to start only when `www.semantius.com` is served by the Worker and
> Netlify is out of the request path.

## The problem

`/docs/reference/` is the canonical URL. Appending `.md` to it gives
`/docs/reference/.md`, which 404s. The convention only works if you first strip
the slash, which no human and no naive agent will do.

Measured against the two reference sites, there are two coherent designs and we
shipped neither:

| | URL shape | Append | Result |
|---|---|---|---|
| Cloudflare docs | `/tools/` | `index.md` | 200 |
| | | `.md` | 404 |
| Firecrawl docs | `/v2-introduction` | `.md` | 200 |
| **Us** | `/reference/` | `.md` | **404** |

The slash is not the bug on its own. Pairing slashed URLs with a `.md`
convention is.

## Where it came from

Nobody chose it. Two defaults compound:

- `build.format` defaults to `directory`, so pages emit as
  `docs/reference/index.html`. Not set in `astro.config.mjs`.
- The host normalises to the slashed form. Cloudflare Workers assets default to
  `auto-trailing-slash`; Netlify's Pretty URLs does the same with a 301.

`trailingSlash` is also unset in `astro.config.mjs`.

## The argument, ranked by strength

1. **The redirect tax is real and measured.** Every hardcoded href in
   `src/**/*.astro` is slash-less (verified: zero slashed hrefs), every
   `NavNode.path` in `src/lib/docs-tree.ts` is slash-less, and `DocsLayout`
   compares against a `normalizedCurrentPath` with the slash stripped. The whole
   codebase already thinks slash-less. The slash exists only at the edge, so
   **every internal navigation is a redirect hop that buys nothing** (4 of 4
   tested). Browsers cache a 301; crawlers and agents doing one-shot fetches do
   not, and they are this project's audience.
2. **The published convention takes two steps where everyone else's takes one.**
   `robots.txt` and `llms-intro.md` both literally instruct "the same path with
   the trailing slash removed and .md appended". Two-step instructions get
   followed wrong.
3. **The naive append 404s.** Narrower than it sounds: anything reading the
   `<link rel="alternate">` or the `Link` header gets the exact URL and never
   guesses. But it is the reason B must precede A, whose entire premise is
   teaching the convention to a human whose address bar shows the slash.

It also means the migration is cheap: there are almost no internal links to
update.

## Plan

### 1. Astro

```js
// astro.config.mjs
trailingSlash: 'never',
```

**Verified, so do not re-derive it.** In
`node_modules/astro/dist/core/build/generate.js`, `getUrlForPath` sets
`ending = trailingSlash === "never" ? "" : "/"` for `directory` format, so
`Astro.url.pathname` becomes `/docs/reference`. The root stays `/`. Output
layout is decided separately by `getOutFolder` and `getOutFile` off
`build.format`, so `docs/reference/index.html` is unchanged. No explicit
canonical normalisation is needed.

> **Trap: do not "simplify" this with `build.format: 'file'`.** It looks like it
> removes the host dependency entirely, and it does not work. The same function
> sets `ending = ".html"` unconditionally for `file` format, ignoring
> `trailingSlash`. `Astro.url.pathname` becomes `/docs/cli.html`, which makes
> the canonical `.../docs/cli.html`, makes `toMarkdownPath()` emit
> `/docs/cli.html.md`, and breaks the active-nav highlighting in `DocsLayout`,
> which compares pathname against slash-less `NavNode.path` values. It would
> also break Tier B, which hardcodes `<pagePath>/index.html` in
> `src/lib/dualmark/integration.ts`.

### 2. Cloudflare

```jsonc
// workplace/wrangler.jsonc
"assets": {
  "directory": "../apps/web/dist/client",
  "not_found_handling": "404-page",
  "html_handling": "drop-trailing-slash"
}
```

`drop-trailing-slash` is a valid value, confirmed in the installed wrangler's
own `config-schema.json`: the `html_handling` enum is
`["auto-trailing-slash", "force-trailing-slash", "drop-trailing-slash", "none"]`.

Documented behaviour: `/foo` serves 200, and `/foo/`, `/foo.html` and
`/foo/index.html` all 307 to `/foo`. So redirects for already-indexed slashed
URLs come for free and no redirect map is needed. Consider whether 301 is wanted
instead of 307.

### 3. Revert the twin code that hard-codes the slash

`src/lib/dualmark/nav.ts`, `canonicalUrl()` explicitly **adds** a trailing
slash. It must become a pass-through, or every twin's `- **URL**:` line points
at a URL that now redirects. There are 8 call sites in `manifest.ts` and
`integration.ts`; none of them need changing.

`toMarkdownPath()` in `src/lib/dualmark/paths.ts` already strips trailing
slashes and is idempotent, so it needs **no change**. Only its header comment
does.

### 4. Rework the `_headers` Link rules

`public/_headers` carries per-page `rel="alternate"` rules:

```
/:s1/
  Link: </:s1.md>; rel="alternate"; type="text/markdown"
```

These rely on the trailing slash as the discriminator between page URLs and
assets, and the file says so in a comment. Every page URL ends in `/`; no asset
URL does. Remove the slash and the rules stop matching pages, and patterns
without it would match `/logo.png` or `/_astro/hash.css`.

**Delete the four rules, and the `/blueprints/page/:n/ ! Link` rule with them.**
Keep `/*` and `/*.md`. A scoped replacement is technically possible (prefix
rules plus `! Link` under `/*.md`) but it would also unset the `describedby`
relation on twins, and `_headers` has no negative matching for the root-level
assets. The HTML `<link rel="alternate" type="text/markdown">` in `SEO.astro`
reaches every page and is the form crawlers actually parse. Losing the header is
a real but small regression. State it in the PR rather than glossing.

### 5. Fix the hand-written slashed URLs

**An earlier draft of this plan said llms.txt follows automatically from
`Astro.site` plus route helpers. That is true of the generated link list and
false of the prose.**

- [ ] `src/data/llms-intro.md`, the "Machine-readable formats" block: the
      convention sentence and all three example URLs are hand-written and
      slashed. This is the first thing an agent reads at `/llms.txt`.
- [ ] `public/robots.txt`: same prose, same stale example.

### 6. Update the comments that document the old shape

They are load-bearing documentation, not decoration:

- [ ] `src/lib/dualmark/paths.ts` header ("every page URL ends in `/`")
- [ ] `src/components/layout/SEO.astro` ("pathname is always `/about/`")
- [ ] `src/lib/dualmark/excluded.ts` (the `/404/` note)
- [ ] `public/_headers` header block
- [ ] Drive-by: `SEO.astro` has an unused `const path` binding

### 7. Sitemap

**Verified, no work needed.** `@astrojs/sitemap` checks
`config.trailingSlash === "never"` *before* the `build.format === "directory"`
branch, so it follows automatically. Confirm in the output anyway.

## Verification

```bash
cd apps/web && SITE_URL=https://www.semantius.com ADAPTER=cloudflare npx astro build
grep -c '/</loc>' dist/client/sitemap-0.xml    # expect 0 slashed locs
grep -o '<link rel="canonical"[^>]*>' dist/client/docs/reference/index.html
find dist/client -name '*.md' -size -100c      # must print nothing
```

Then on a preview deploy, with `U` from `.preview-url.md`. **This matrix covers
the redirect map, which an earlier draft omitted**: `astro.config.mjs` ships
roughly 60 redirects into `dist/client/_redirects`, and those are the entries
most likely to interact badly with `html_handling`.

```bash
for p in /docs/reference /docs/reference/ /docs/reference.md \
         /docs/models-overview /docs/models-overview/ /docs/models-overview.md \
         /models/itsm; do
  printf '%-28s %s\n' "$p" "$(curl -sS -o /dev/null -w '%{http_code} %{redirect_url}' "$U$p")"
done
# want: /docs/reference      -> 200
#       /docs/reference/     -> 307 to /docs/reference
#       /docs/reference.md   -> 200
# watch for double hops on the legacy paths (307 drop-slash, then 301)

curl -sS -o /dev/null -w '%{http_code}\n' "$U/docs/cli"   # want 200, not a redirect
curl -sS "$U/docs/cli" | grep -o 'rel="alternate" type="text/markdown"[^>]*'
```

## Risks

| Risk | Note |
|---|---|
| Ranking wobble while Google consolidates 189 changed canonicals | Normal migration. `drop-trailing-slash` issues the redirects automatically. |
| Per-page `Link` header is lost | Accepted above. The HTML link covers it. |
| Netlify disagreeing | Eliminated by section 0. Do not start B before it is done. |
| `Astro.url.pathname` shape | Resolved and verified. See step 1. |

## What NOT to do

Do not add a `/*/.md` redirect to paper over it. It keeps the incoherent URL
shape and adds an ugly path nobody publishes. If the slash has to stay for some
reason, the coherent fallback is Cloudflare's convention instead: serve
`/docs/reference/index.md`. That one can live in Astro's `redirects` map, which
materialises for every adapter, so it is host-independent. It fixes the
two-step convention but not the redirect tax. That is the compromise, not the
goal.

---

# A. Markdown and copy actions in the docs page header

## What to build

Under the `<h1>` in `DocsLayout`, a visible link plus a small menu:

```
Docs > Reference > CLI
# CLI
M/ View as Markdown          [ Copy page  v ]
                               - Copy as Markdown
                               - Ask Claude
                               - Ask ChatGPT
```

Reference implementations: `developers.cloudflare.com/agents/concepts/tools/`
(all links inline, no menu) and `docs.firecrawl.dev/api-reference/v2-introduction`
(everything in one split-button menu).

## Why this shape

- **The visible link is "View as Markdown", not "Ask Claude"**, even though
  Ask has higher per-click value. The link teaches a convention: once a reader
  learns `/docs/cli.md` works, they use it on pages they never visit. Ask is
  self-contained and teaches nothing. The teaching affordance gets the prime
  slot.
- **The menu earns itself at three items.** Two would not.
- **None of this is for agents.** Agents use `rel="alternate"`, the `Link`
  header and `llms.txt`, all of which already ship. Every affordance here is
  for a human reader. Design it that way.

## Decisions already taken

Do not relitigate these.

- **The Ask deep links are confirmed working.** The human verified that
  `https://claude.ai/new?q=<encoded>` and `https://chatgpt.com/?q=<encoded>`
  open a prefilled conversation, and the pattern is spreading via Mintlify. So
  the menu keeps all three items.
- **Copy fetches the `.md` twin at click time.** Not a build-time inline.
  `entry.data.markdownTwin` exists on every docs entry and would avoid the
  fetch, but it costs up to 15KB of duplicated content per page and is the
  pre-composed body without the header and Related footer, so it is not
  byte-identical to the served `.md`.
- **Docs only, written to extend.** Ship it in `DocsLayout`, but as a standalone
  component taking the page path, so blog and blueprints are a one-line import
  later.
- **Suppress the whole control on `noindex`**, matching the condition in
  `SEO.astro`. Otherwise the page header advertises a twin the `<head>`
  deliberately does not. Twins are emitted for noindex pages regardless, so this
  is consistency, not a 404.

## Implementation notes

- **No React island.** A `<details>` / `<summary>` element gives a
  keyboard-accessible menu with zero JavaScript. This matches the header, which
  `CONTEXT-MEMORY.md` records as static Astro plus vanilla JS.
- **`CopyButton.astro` cannot be reused as-is**, despite what an earlier draft of
  this plan said. It copies a build-time `data-text` prop and has no fetch path.
  It gives you the icon and copied-state pattern to copy, not the behaviour. It
  also binds via a global `.copy-button` query, so a second variant on the page
  needs a distinct hook or it gets double-bound.
- Handle a failed fetch. A `.md` that 404s must not leave the button showing a
  "copied" state.
- The markdown href is `toMarkdownPath(Astro.url.pathname)` from
  `~/lib/dualmark/paths`, already imported in `SEO.astro`.
- `hasMarkdownTwin()` from `~/lib/dualmark/excluded` is **inert in this layout**:
  the only exclusions are `/404` and `/blueprints/page/N`, and neither uses
  `DocsLayout`. Fine to keep for symmetry, but it gates nothing.
- Layout budget: the docs grid is `lg:grid-cols-[280px_1fr_240px]` with
  `gap-10` inside `max-w-360`, so the content column is about 800px at its
  widest. A link plus a button fits comfortably. Four inline items with a date
  would not.
- Put it in `src/layouts/DocsLayout.astro` between the breadcrumb row and the
  `<h1>`, and mark it `data-pagefind-ignore` so it stays out of the search
  index.
- The site does not use `<ClientRouter />`, but every existing inline script
  listens for `astro:page-load` anyway. Match that.
- **Point the Ask prompt at the `.md` twin, not the HTML page.** This is the
  whole payoff: Claude fetches clean markdown instead of parsing our nav, cookie
  banner and hydration scripts. Something like:

  ```
  Read https://www.semantius.com/docs/cli.md and help me with:
  ```

- **User-initiated fetches are not blocked.** Verified against production:
  `Claude-User`, `ChatGPT-User` and `Perplexity-User` all return 200 even while
  `ClaudeBot` and `GPTBot` are 403 at the zone. Cloudflare blocks training
  crawlers while allowing user-initiated fetches, which is the correct shape and
  means this feature is not blocked behind the crawler-policy item in
  `aeo-followup.md`.

## Worth considering, not blocking

An MCP entry would be more on-brand for an agent-platform company than handing
readers to a general assistant. Mintlify ships `mcp` and `add-mcp` options that
install a server into the reader's client. The blocker is that our MCP endpoints
are per-tenant (`https://<name>.semantius.io/mcp`), so there is no site-level
server to advertise. A public read-only MCP over the docs and blueprints would
be the differentiating version. Separate decision, larger than this task.

---

# Records to update when the work lands

- [ ] `CONTEXT-MEMORY.md`, "Custom response headers" section: it currently states
      the site deploys to both Cloudflare and Netlify and that `_headers` must
      stay platform-neutral. Rewrite after section 0.
- [ ] `CONTEXT-MEMORY.md`: add the trailing-slash decision and the
      `build.format: 'file'` trap, so nobody re-proposes it.
- [ ] `CONTEXT-MEMORY.md`: record the AI crawler-block decision from section 0.
- [ ] `aeo-followup.md`: close item 2 if the crawler block was resolved.
- [ ] Delete this file once all three sections are done.
