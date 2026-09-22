# AEO follow-up

Open items after the markdown twins work landed on the `aeo` branch
(commit `7da06c2`). Written at the end of that implementation, from a review of
the committed code plus the deployed preview.

Context for anyone picking this up: every HTML page is now also published as
agent-facing markdown at `<page-url>.md` (176 twins, plus 56 verbatim blueprint
source downloads). The architecture is documented in `CONTEXT-MEMORY.md` under
"Every page is published twice: HTML and markdown".

Preview used for verification:
https://aeo-20260922102428-semantius-site.ma532.workers.dev

---

## Blockers before this is production ready

### 1. BLOCKS THE PRODUCTION RELEASE: decide what `/pricing` claims

**Size: small to override, medium to fix properly.**

`/pricing.md` now publishes, as clean quotable markdown:

- "We offer a 14-day free trial on the Pro plan"
- "We accept all major credit cards, PayPal, and wire transfers for Enterprise"
- "we have a 30-day money-back guarantee"

while every price in the same document reads `X`. `/index.md` ends with "No
credit card required for open source. 14-day free trial for Pro."

This copy is placeholder template content in `pricing.astro`. It was always on
the page, but it was buried in Tailwind markup; it is now the clean canonical
statement an answer engine will quote about Semantius pricing.

Note this corrects an assessment made during planning. The claim was that twins
would not amplify the pricing problem because the JSON-LD sits outside `<main>`.
That is true of the fabricated `0` / `29` / `99` prices, and wrong about the
FAQ, which is visible page content and therefore extracted.

Either finish the pricing copy, or land
`apps/web/src/data/twin-overrides/pricing.md` as a hand-written twin. The second
is a one file drop and is what Resend does for the same page.

### 2. RESOLVED 2026-09-22: GPTBot and ClaudeBot are unblocked

**Done.** Re-measured against `https://www.semantius.com/llms.txt` after the
change: GPTBot 200, ClaudeBot 200, and OAI-SearchBot, Claude-SearchBot,
Claude-User and PerplexityBot unchanged at 200.

Two corrections to what this item originally claimed, so the reasoning is not
reused as-is next time:

- **Only the Training category was ever blocked.** The line below about "the
  two crawlers that matter most" overstated it. ChatGPT Search reaches this
  site through OAI-SearchBot, Claude's search through Claude-SearchBot, and
  live fetches through Claude-User and ChatGPT-User. All four returned 200
  throughout. Unblocking Training was therefore a licensing decision, not an
  AEO one.
- **The setting is under `AI Crawl Control` in the zone sidebar**, not under
  Security, and it is per-crawler across three categories (Search, Agent,
  Training) rather than one "Block AI bots" switch.

**Caveat that now matters more than the block did:** the crawlers are in, and
production still serves the 2026-05-27 build. Every `.md`, `llms-full.txt` and
every `Link` header 404s or is absent there. See item 2 of the "Still open"
list in `aeo-next-session.md`.

---

*Original text follows.*

**Size: small. A dashboard toggle, not code.**

Measured against `https://www.semantius.com` during planning:

| Crawler | `/about/` | `/llms.txt` |
| --- | --- | --- |
| GPTBot | 403 | 403 |
| ClaudeBot | 403 | 403 |
| PerplexityBot, OAI-SearchBot, Googlebot | 200 | 200 |

Cloudflare's AI training-crawler block is on for the zone. The decision taken
was to unblock both. Until that happens, all 176 documents are invisible to the
two crawlers that matter most for a developer platform.

**The `workers.dev` preview is not behind that zone and returns 200, so no
amount of preview testing will reveal this.** Verify against the production
hostname:

```bash
for ua in "...GPTBot/1.4..." "...ClaudeBot/1.0..."; do
  curl -sS -o /dev/null -A "$ua" -w "%{http_code}\n" https://www.semantius.com/llms.txt
done
```

Record the decision and its reasoning in `CONTEXT-MEMORY.md` so the next person
to see the toggle does not quietly revert it.

### 3. Replace the mtime heuristic for "claimed by the route writer"

**Size: small.** `apps/web/src/lib/dualmark/integration.ts`

Tier B decides whether to extract a page by checking whether its `.md` already
exists with an mtime at or after the build start. That is a heuristic standing
in for a handshake, and it was observed failing: a build reported
`176 markdown twins (176 from source, 0 extracted)`, meaning Tier B silently did
nothing for all 39 pages while the report claimed success.

Failure modes: any process touching `dist` during a build, the one second slack
window, and `buildStart` staying `0` if `astro:build:start` never fires, which
would skip extraction for every page with no warning.

The route writer already builds the exact set it claimed, in the `seen` set in
`apps/web/src/pages/[...twin].md.ts`. Persist that and read it in the
integration. A coverage report that can be confidently wrong is worse than none.

---

## Quality

### 4. Tier B loses meaning, not just polish

**Size: medium.** `apps/web/src/lib/dualmark/source.ts`

Concrete losses on the deployed preview:

- `/pricing.md` — the "Compare Plans" table has **blank cells** wherever the
  HTML used a check or cross SVG. All of the Analytics rows read as empty for
  all three plans, so an agent concludes those features are absent everywhere.
  `DROP_TAGS` drops `svg` with no `aria-label` or `title` fallback.
- `/about.md` — icon-only links become `[](https://github.com/gladtek)`.
- `/skills/itsm.md` — inline siblings concatenate with no separator:
  `AI Triage and ClassificationApproval Workflow OrchestrationSkill-Based...`.
  Same bug yields `ProMost Popular` as a table header in `/pricing.md`.
- `/contact.md` — says "Fill out the form below" and then has no form, because
  `form` is in `DROP_TAGS`.

Map check and cross SVGs to `Yes` / `No` via their accessible name, give
icon-only links their label, and insert a separator between concatenated inline
siblings.

Related: `DROP_TAGS` is a superset of the Pagefind `excludeSelectors` contract
(`form`, `button`, `svg`, `iframe`, `template` are ours). The "one definition
serves both" comment in `integration.ts` overstates it slightly, and should
either be narrowed or the comment corrected.

### 5. Implement the Tier C `sourceHash` staleness check

**Size: medium. Sequence immediately after item 1.**

The plan specified this in detail and it was not built, and the omission was not
announced. It is the named mitigation for the plan's own worst risk: a stale
hand-written `/pricing.md` means agents quote prices we no longer charge, and
nothing about a hand-written file tells you it went stale.

As specified: store `sha256` of what Tier B *would* have extracted, taken before
nav-context injection and before `normalizeUnicode`, in the override's
frontmatter. The build runs Tier B for overridden pages anyway, discards the
output and compares. **On mismatch the report must print the new value**, or the
check is ornamental because nobody can regenerate the hash by hand.

Also note overrides are currently served verbatim, so any frontmatter an author
writes is emitted into the served document. Strip it.

Not urgent while `src/data/twin-overrides/` is empty. Urgent the moment item 1
lands an override.

### 6. Make the `.astro` route pages import `src/lib/routes.ts`

**Size: medium. Touches four shipped route files, so it needs its own
verification pass.**

`routes.ts` documents itself as the single source of truth for content URLs, and
today it is a second place: it is imported by the twin writers, `llms.txt.ts`
and `rss.xml.js`, but **none of the four route pages use it**. They still inline
their own expressions:

- `apps/web/src/pages/blog/[...slug].astro`
- `apps/web/src/pages/docs/[...slug].astro` (both the extension strip and the
  `/index` strip, duplicated verbatim)
- `apps/web/src/pages/blueprints/[slug]/index.astro` (slug plus the
  domain/blueprint collision precedence)
- `apps/web/src/pages/skills/[slug]/index.astro`

Consequence: `blogSlug`, `docsSlug`, `domainSlug`, `domainHasLanding`,
`domainPath` and `skillSlug` have zero consumers.

The `rss.xml.js` fix is real and valuable. The structural anti-drift guarantee
is not, yet. Either finish it or delete the unused exports and stop claiming it.

### 7. Smaller correctness gaps

**Size: small each.**

- `/index.md` has two H1s. The leading-heading lift in `integration.ts` matches
  ATX headings only, and the homepage `<h1>` contains a `<br>` so it serialises
  as a setext heading.
- `getBlueprintSources()` in `manifest.ts` filters out a source whose body came
  back empty. That is exactly the workerd regression the build is supposed to
  catch, turned into silence. Log it instead. The new `232 .md files total`
  report line helps but does not assert.
- The size-floor warning fires on deliberate Tier C overrides, which are an
  explicit decision rather than extraction failing.

---

## Housekeeping

**Size: small, all of it.**

- `apps/web/README.md` has no third-party / dualmark / Apache-2.0 mention. It
  was a stated licence deliverable. Everything else is in place: vendored
  licence text, `NOTICE`, pinned upstream SHA, per-file headers.
- Dead exports with no consumers: `toHtmlPath`, `isMarkdownPath`,
  `toMarkdownUrl` in `paths.ts`, `allOverridePaths` in `manifest.ts`, and the
  `blueprintSlug` re-export. The comment on `toHtmlPath` claims the coverage
  report uses it, which it does not.
- `Cache-Control: public, max-age=3600` applies to the HTML 404 served for a
  missing `.md`, so an agent that guesses a twin URL an hour before it ships
  caches the 404.
- `apps/web/.env` ships `SITE_URL=http://localhost:4321`. It is now defused for
  the twins, but it remains a loaded gun for anything else that reads
  `process.env.SITE_URL` after Vite's env merge.

---

## Decisions taken, recorded so they are not relitigated

**No Worker.** Both representations are built as static files, so a Worker would
only route between two files that already exist. It would buy same-URL `Accept`
negotiation, which no major crawler documents honouring, and a markdown-aware
404. Full reasoning is in the plan under "Why no Worker". Revisit only if
evidence appears that a crawler we care about negotiates on `Accept`.

**`Content-Type` is pinned on `/*.md`,** and this deliberately overrides an
earlier analysis that ruled it out. Cloudflare serves `.md` with no charset, and
markdown cannot declare its encoding in band, so without the pin every twin
containing real UTF-8 mis-decodes; Python `requests` in particular defaults
`text/*` to ISO-8859-1.

Verified on a preview that the pin also labels the HTML 404 body as
`text/markdown` for a missing `.md`. Accepted: the 404 status code stays
correct and is the primary signal, whereas the alternative mis-decodes 232 valid
files. The clean fix for both is a markdown-aware 404, which needs a Worker.

**`bots.ts` and `negotiate.ts` were not ported.** With the Worker not planned,
they would be dead code.

---

## Pre-existing problems this work surfaced

Not caused by the twins, but now more visible because the same content is
published in a format designed to be quoted verbatim.

- Placeholder marketing copy is now machine-readable: `/pricing.md` prices as
  `X` and `f1`–`f10` feature names, `/about.md` full of Interstellar characters
  at `interstellar.com`, `/contact.md` with `+1 (555) 123-4567`. **Large**, and
  it is content work rather than engineering.
- `/pricing` JSON-LD publishes `Offer` prices of `0`, `29` and `99` while the
  page renders `X`. More urgent than judged during planning, because the visible
  FAQ that the JSON-LD mirrors is itself now republished.
- `BlogPosting` JSON-LD renders in the body with a leaked `slot="head"`, so the
  slot is not being consumed. Cosmetic, since JSON-LD is valid anywhere.
- `404.html` declares `robots: index, follow`.
- `WebSite.potentialAction` points at `//search?q=`, a double slash and a 404.
  The site's search is a Pagefind modal with no URL.
- Docs and blueprints carry no per-page schema.org type. `TechArticle` and
  `Dataset` are the obvious additions.
- No freshness signal anywhere: the `docs` collection schema has no date field
  and the sitemap has no `lastmod`. Twins are a natural place to surface one;
  derive it from git in the content loader.
- The `skills` collection is empty. Its loader globs `*/README.mdx` under
  `skills/`, and no such file exists in any of the 15 directories, so
  `getCollection('skills')` returns `[]` and the related-skills block on every
  blueprint page is silently always empty. Worth confirming that is intended.
