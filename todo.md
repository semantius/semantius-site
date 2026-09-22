# TODO

The single place to look. Detail lives in the linked files; this page exists so
nothing has to be remembered.

Last reviewed: 2026-09-22.

---

## 🔴 Blocks the production release

### Pricing page publishes placeholder commitments

`apps/web/src/pages/pricing.astro` carries template FAQ copy that reads as real
commercial terms:

> "We offer a **14-day free trial** on the Pro plan"
> "We accept all major credit cards, **PayPal**, and **wire transfers** for Enterprise"
> "Yes, we have a **30-day money-back guarantee**"

while every price on the same page renders as `X/month`.

**Held, not solved.** `/pricing` is in the `EXCLUDED` list in
`apps/web/src/lib/dualmark/excluded.ts`, so no `/pricing.md` twin is published
and the page advertises no markdown alternate. That restores the status quo —
the claims stay buried in HTML markup where they have always been — but it does
not make them true, and the HTML page is still indexed and still says this.

**To close it:** either write the real terms into the page, or land a
hand-written twin at `apps/web/src/data/twin-overrides/pricing.md`. Then remove
the `/pricing` entry from `EXCLUDED`; nothing else needs changing, `twinUrl()`
already falls back correctly.

Needs a decision from a human on what the actual trial, payment and refund
terms are. Detail: `aeo-followup.md` item 1.

---

## Next up

### Production release

`main` is merged and ready but **not pushed**. Pushing now triggers
`.github/workflows/deploy.yml`, which deploys straight to production — so the
push *is* the release. Do not push until the pricing item above is closed.

Production currently serves the **2026-05-27 build**: 57 commits behind, no
markdown twins, no `llms-full.txt`, and `public/_headers` has never taken
effect there at all. The AI crawlers were unblocked on 2026-09-22 and are
crawling that stale build right now, which makes this more urgent rather than
less.

### Verify against production once the release lands

Two things are structurally unverifiable on a preview deploy and must be
checked on `www.semantius.com`:

- **`X-Robots-Tag` behaviour.** `workers.dev` injects `noindex` on every
  response, including `/logo.png`, so a rule that does nothing looks identical
  to one that works.
- **Whether Cloudflare's Bot Preference Sync prepends to `robots.txt`.** The
  toggle is on and currently prepends nothing, but our real `robots.txt` has
  never been live. It explicitly warns against disallowing `/*.md`, which is
  exactly what a sync could inject above it.

Also worth a look afterwards: **Agent Readiness** in the Cloudflare zone
sidebar, to see whether the twins and `llms.txt` are detected.

### Remove Netlify (section 0b)

Gated deliberately. It is the rollback path, and a rollback stays plausible
until the release above has landed and held. Steps are in `aeo-next-session.md`
section 0b.

---

## Decisions waiting on a human

| | |
|---|---|
| **Real pricing terms** | Blocks the release. See above. |
| **`Accept: text/markdown` handling** | Agents that content-negotiate instead of reading `rel="alternate"` currently get HTML. Two options: Cloudflare's "Markdown for Agents" toggle (machine conversion of the rendered page) or a zone Redirect Rule matching the Accept header and redirecting to our own twin. The second serves better content and still costs no Worker invocation; plan availability of `http.request.headers` in Redirect Rules is unconfirmed. Detail: `aeo-next-session.md`. |
| **Training-crawler policy** | Resolved 2026-09-22: GPTBot and ClaudeBot unblocked. Recorded so it is not silently reverted — note that only the *Training* category was ever blocked, and AI-answer visibility never depended on it. |

---

## Done, for context

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
