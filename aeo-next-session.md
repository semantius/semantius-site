# AEO: next session

Two pieces of work, independent of each other. Do **B before A** if you do both:
B changes URL shape, and A builds UI that embeds URLs.

Written for whoever picks this up fresh. Background on the markdown twins is in
`CONTEXT-MEMORY.md` under "Every page is published twice: HTML and markdown";
open items from that work are in `aeo-followup.md`. This file does not repeat
either.

---

# A. Markdown and copy actions in the docs page header

## What to build

Under the `<h1>` in `DocsLayout`, a visible link plus a small menu:

```
Docs > Reference > CLI
# CLI
M↓ View as Markdown          [ ⧉ Copy page  ▾ ]
                               ├ Copy as Markdown
                               ├ Ask Claude
                               └ Ask ChatGPT
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
- **The menu earns itself at three items.** Two would not. Do not build a menu
  if you drop the Ask options.
- **None of this is for agents.** Agents use `rel="alternate"`, the `Link`
  header and `llms.txt`, all of which already ship. Every affordance here is
  for a human reader. Design it that way.

## Implementation notes

- **No React island.** A `<details>`/`<summary>` element gives a
  keyboard-accessible menu with zero JavaScript. Only the copy action needs
  script, and `src/components/common/CopyButton.astro` already does that with a
  plain inline listener. This matches the header, which `CONTEXT-MEMORY.md`
  records as static Astro plus vanilla JS. Adding an island here would not earn
  it.
- The markdown href is `toMarkdownPath(Astro.url.pathname)` from
  `~/lib/dualmark/paths`, already imported in `SEO.astro`. Guard with
  `hasMarkdownTwin()` from `~/lib/dualmark/excluded` so the control never
  appears on a page with no twin.
- Copy should fetch the `.md` twin and write it to the clipboard, not
  `innerText` of the rendered page. The twin is the better artifact and it is
  one fetch.
- Layout budget: the docs grid is `lg:grid-cols-[280px_1fr_240px]` with
  `gap-10` inside `max-w-360`, so the content column is about 800px at its
  widest. A link plus a button fits comfortably. Four inline items with a date
  would not.
- Put it in `src/layouts/DocsLayout.astro` between the breadcrumb row and the
  `<h1>`, and mark it `data-pagefind-ignore` so it stays out of the search
  index and out of Tier B markdown extraction.

## Verify the deep-link URLs before shipping

**Do not take these from memory, including mine.** Mintlify documents that the
options exist but not their URL formats, and both reference sites render the
menu client-side so the URLs are not in their HTML.

The patterns in circulation are `https://claude.ai/new?q=<encoded>` and
`https://chatgpt.com/?q=<encoded>`. Open each in a browser with a test prompt
and confirm the conversation opens prefilled before wiring them up.

**Point the prompt at the `.md` twin, not the HTML page.** This is the whole
payoff: Claude fetches clean markdown instead of parsing our nav, cookie banner
and hydration scripts. Something like:

```
Read https://www.semantius.com/docs/cli.md and help me with:
```

**This works today.** Verified against production: `Claude-User`,
`ChatGPT-User` and `Perplexity-User` all return 200, even though `ClaudeBot` and
`GPTBot` are 403 at the Cloudflare zone. Cloudflare blocks training crawlers
while allowing user-initiated fetches, which is the correct shape and means this
feature is not blocked behind the crawler-policy item in `aeo-followup.md`.

## Worth considering, not blocking

An MCP entry would be more on-brand for an agent-platform company than handing
readers to a general assistant. Mintlify ships `mcp` and `add-mcp` options that
install a server into the reader's client. The blocker is that our MCP endpoints
are per-tenant (`https://<name>.semantius.io/mcp`), so there is no site-level
server to advertise. A public read-only MCP over the docs and blueprints would
be the differentiating version. Separate decision, larger than this task.

---

# B. Remove the trailing slash

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
- Cloudflare's `html_handling` defaults to `auto-trailing-slash`, which serves
  that file at `/docs/reference/` and 307s the bare form to it.

`trailingSlash` is also unset in `astro.config.mjs`.

## The argument for removing it is stronger than "it is ugly"

**Every internal link on the site currently eats a redirect.** All hardcoded
hrefs in `src/**/*.astro` are slash-less, and every `NavNode.path` in
`src/lib/docs-tree.ts` is slash-less, and `DocsLayout` compares against a
`normalizedCurrentPath` with the slash stripped. The entire codebase already
thinks in slash-less paths. The slash exists only at the edge, where Cloudflare
adds it, so every internal navigation is a 307 hop that buys nothing.

That also means the migration is far cheaper than it looks: there are almost no
internal links to update.

## Plan

### 1. Astro

```js
// astro.config.mjs
trailingSlash: 'never',
```

Leave `build.format` alone. It stays `directory`, so output stays
`docs/reference/index.html` and nothing about the build layout changes. Only the
URL Astro considers canonical changes.

**Verify, do not assume:** confirm what `Astro.url.pathname` returns in a static
build with this set. `SEO.astro` derives the canonical from it in 4 places, and
`toMarkdownPath` depends on its shape. If it still yields a trailing slash, the
canonical must be normalised explicitly.

### 2. Cloudflare

```jsonc
// workplace/wrangler.jsonc
"assets": {
  "directory": "../apps/web/dist/client",
  "not_found_handling": "404-page",
  "html_handling": "drop-trailing-slash"
}
```

Documented behaviour of `drop-trailing-slash`: `/foo` serves 200, `/foo/` 307s
to `/foo`, `/foo.html` and `/foo/index.html` also 307 to `/foo`. So the 301s for
already-indexed slashed URLs come for free; no redirect map is needed.

### 3. Revert the twin code that hard-codes the slash

`src/lib/dualmark/nav.ts`, `canonicalUrl()` explicitly **adds** a trailing
slash. I wrote that to match the then-current behaviour. It must become a
pass-through, or every twin's `- **URL**:` line will point at a URL that now
redirects.

Grep for other assumptions: `apps/web/src/lib/dualmark/` and
`apps/web/src/components/layout/SEO.astro`.

### 4. Rework the `_headers` Link rules. This is the real cost.

`public/_headers` carries per-page `rel="alternate"` rules:

```
/:s1/
  Link: </:s1.md>; rel="alternate"; type="text/markdown"
```

**These rely on the trailing slash as the discriminator between page URLs and
assets**, and the file says so in a comment. Every page URL ends in `/`; no
asset URL does. Remove the slash and the rules stop matching pages, and patterns
without it could match `/logo.png` or `/_astro/hash.css`.

There is no clean replacement. `/:s1` would match assets; prefix rules like
`/docs/*` would also match `/docs/cli.md` and give a markdown file a
`rel="alternate"` pointing at itself.

**Recommendation: delete those four rules.** The HTML
`<link rel="alternate" type="text/markdown">` in `SEO.astro` reaches every page
on every platform and is the form crawlers actually parse. The header was a
bonus for clients that never parse HTML. Losing it is a real but small
regression, and it is worth stating in the PR rather than glossing.

Keep the `/blueprints/page/:n/ ! Link` unset rule only if the four rules stay.
If they go, it goes too.

### 5. Sitemap and llms.txt

Both derive from `Astro.site` plus route helpers, so they should follow
automatically. Confirm rather than assume: `dist/client/sitemap-0.xml` should
have 189 `<loc>` entries with no trailing slashes, and `llms.txt` links should
be unchanged (they already point at `.md`).

## Verification

```bash
cd apps/web && SITE_URL=https://www.semantius.com ADAPTER=cloudflare npx astro build
grep -c '/</loc>\|/</loc>' dist/client/sitemap-0.xml     # expect 0 slashed locs
grep -o '<link rel="canonical"[^>]*>' dist/client/docs/reference/index.html
```

Then on a preview deploy, with `U` from line 3 of `.preview-url.md`:

```bash
for p in /docs/reference /docs/reference/ /docs/reference.md; do
  printf '%-24s %s\n' "$p" "$(curl -sS -o /dev/null -w '%{http_code} %{redirect_url}' "$U$p")"
done
# want: /docs/reference -> 200
#       /docs/reference/ -> 307 to /docs/reference
#       /docs/reference.md -> 200

# internal links no longer redirect
curl -sS -o /dev/null -w '%{http_code}\n' "$U/docs/cli"   # want 200, not 307

# rel=alternate still present in HTML after the _headers rules are removed
curl -sS "$U/docs/cli" | grep -o 'rel="alternate" type="text/markdown"[^>]*'
```

## Risks

| Risk | Note |
|---|---|
| Ranking wobble while Google consolidates 189 changed canonicals | Normal migration. `drop-trailing-slash` issues the 307s automatically. Consider whether 301 is wanted instead. |
| Per-page `Link` header is lost | Accepted above. The HTML link covers it. |
| Netlify is still live and does not read `wrangler.jsonc` | While both targets are up, Netlify keeps its own slash behaviour and the two will disagree. Either finish the Cloudflare migration first or set the equivalent in `netlify.toml`. |
| `Astro.url.pathname` shape | The one genuine unknown. Verify at step 1 before building on it. |

## What NOT to do

Do not add a `/*/.md` redirect to paper over it. It keeps the incoherent URL
shape and adds an ugly path nobody publishes. If the slash stays for any reason,
the coherent fallback is Cloudflare's convention instead: serve
`/docs/reference/index.md` via one redirect line, `/*/index.md /:splat.md 301`.
That is the compromise, not the goal.
