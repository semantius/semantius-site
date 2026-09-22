# TODO

The single place to look. Detail lives in the linked files; this page exists so
nothing has to be remembered.

Last reviewed: 2026-09-22.

---

## 🔴 Open: pricing page states things that are not true

`apps/web/src/pages/pricing.astro` carries template FAQ copy that reads as real
commercial terms:

> "We offer a **14-day free trial** on the Pro plan"
> "We accept all major credit cards, **PayPal**, and **wire transfers** for Enterprise"
> "Yes, we have a **30-day money-back guarantee**"

while every price on the same page renders as `X/month`.

**Contained, not fixed.** `/pricing` is in `EXCLUDED` in
`apps/web/src/lib/dualmark/excluded.ts`, so no `/pricing.md` twin exists and the
page advertises no markdown alternate. That stops the claims becoming cleanly
machine-quotable. **The HTML page is live and still says all of this**, and it is
indexed.

**To close it:** write the real terms into the page, or land a hand-written twin
at `apps/web/src/data/twin-overrides/pricing.md`. Then remove the `/pricing`
entry from `EXCLUDED` and the exception note in `public/robots.txt`. Nothing else
needs changing; `twinUrl()` already falls back correctly.

Needs a human decision on the actual trial, payment and refund terms.
Detail: `aeo-followup.md` item 1.

---

## Next up

### Write the twin abstract for an agent, not for a search snippet

Every twin's header carries a one-line abstract, taken from the page's
`<meta name="description">` (Tier B) or the content frontmatter `description`
(Tier A). Both are written for a search result: they sell the page. Neon's
twins carry a different thing in the same slot, written for an agent deciding
whether to open the page at all:

> Summary: Connection guide for wiring a Next.js application to Neon serverless
> Postgres using node-postgres, postgres.js, or the Neon serverless driver.
> Choose this page when you need working DATABASE_URL setup and driver code for
> App Router (Server Components, Server Actions), Pages Router, Serverless
> Functions, or Edge Functions. The guide also explains Next.js static render
> caching and the force-dynamic workaround.

Note the shape: what the page covers, **when to choose it**, and what else is
on it that the title does not imply. Three to five sentences, concrete nouns,
no positioning. Ours currently reads "Detailed documentation for models,
business logic, MCP connectors, agent skills and the CLI." - true, and no help
in deciding anything.

**Where it would go.** `docHeader()` in `apps/web/src/lib/dualmark/compose.ts`
renders `meta.description`. The cleanest shape is a separate optional
`agentSummary` field that falls back to `description` when absent, so an
unwritten page degrades to today's output rather than to nothing:

- **Docs and blog** (Tier A): add `agentSummary` to the collection schemas in
  `apps/web/src/content.config.ts` and write it per page in frontmatter. It must
  NOT be rendered in the HTML page - it is not marketing copy, and duplicating
  it on the page invites someone to "fix" it back into a sales line.
- **Blueprints** (Tier A): derivable rather than hand-written. `system_name` +
  the entity count + the domain already say what the model covers; a generated
  sentence beats 56 hand-written ones.
- **Tier B pages** (marketing, skills, domain landings): no source to read it
  from. Either leave them on the meta description or add a small override map
  beside `src/data/twin-overrides/`.

**Why it is worth doing.** The abstract is what an agent reads before deciding
to fetch the body, and it is what an answer engine quotes. It is also the one
part of the header we have not borrowed from the convention Neon set: the
breadcrumb, the index link and the URL line all match theirs already.

**Not blocked on anything.** It is copywriting plus a schema field, and the
parity guard in `integration.ts` will not complain either way - it compares the
body, not the header.

### Remove Netlify (section 0b)

The gate was "after the release has landed and held". It landed on 2026-09-22.
Let it sit for a few days, then follow `aeo-next-session.md` section 0b. Until
then `pnpm deploy:netlify` from an earlier commit is still the escape hatch.

---

## Decisions waiting on a human

| | |
|---|---|
| **Real pricing terms** | The release shipped with the twin held, so this no longer blocks anything — but the live HTML page still states a 14-day trial, PayPal/wire payment and a 30-day money-back guarantee. See the top of this file. |
| **`Accept: text/markdown` handling** | Agents that content-negotiate instead of reading `rel="alternate"` currently get HTML. Two options: Cloudflare's "Markdown for Agents" toggle (machine conversion of the rendered page) or a zone Redirect Rule matching the Accept header and redirecting to our own twin. The second serves better content and still costs no Worker invocation; plan availability of `http.request.headers` in Redirect Rules is unconfirmed. Detail: `aeo-next-session.md`. |
| **Training-crawler policy** | Resolved 2026-09-22: GPTBot and ClaudeBot unblocked. Recorded so it is not silently reverted — note that only the *Training* category was ever blocked, and AI-answer visibility never depended on it. |

---

## Done, for context

**Released to production 2026-09-22** via `.github/workflows/deploy.yml`, which
now deploys on every push to `main`. Verified live:

```
/docs/cli        200            slash-less canonical, no redirect hop
/docs/cli/       301 -> /docs/cli
/docs/cli.md     200            twin, Link: rel="canonical" -> /docs/cli
/llms-full.txt   200
/pricing.md      404            deliberately held
ClaudeBot, GPTBot on /docs/cli.md   200
```

Both things that could only ever be checked on the real host came out clean:
**no `X-Robots-Tag`** anywhere (the `workers.dev` preview masks this by
injecting its own `noindex`), and **Bot Preference Sync prepends nothing** to
`robots.txt` — our own 701-byte file is served verbatim. Worth re-checking if
that toggle is ever reconfigured.



- Markdown twins: every page also published at `<page-url>.md`, plus
  `/llms.txt` and `/llms-full.txt`.
- Canonical URLs lost the trailing slash; internal navigation no longer pays a
  redirect hop.
- Docs pages carry a markdown/copy/ask actions row.
- Twins carry `rel="canonical"` to their HTML page instead of `noindex`, so
  nothing markdown is suppressed.
- Verbatim blueprint sources moved to `/blueprints/source/`, which is what made
  that possible.
- AI crawler block lifted at the zone.

---

## Related files

| File | What it holds |
|---|---|
| `aeo-next-session.md` | The AEO plan: the cutover, the trailing-slash work, the docs actions. Includes the traps each one cost. |
| `aeo-followup.md` | Open items from the markdown-twins implementation. |
| `CONTEXT-MEMORY.md` | Architecture and environment knowledge that outlives any one task. Read before starting work. |
