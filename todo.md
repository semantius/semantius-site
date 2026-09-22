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

### Remove Netlify

The gate was "after the release has landed and held". It landed on 2026-09-22.
Let it sit a few days first: until the Netlify project is deleted,
`pnpm deploy:netlify` from an earlier commit remains a working escape hatch,
which is the whole reason this is still in the tree.

- [ ] Delete `apps/web/netlify.toml` and `workplace/deploy-netlify.sh`
- [ ] Remove `build:netlify` and `deploy:netlify` from the root and `apps/web`
      `package.json`
- [ ] Remove the `deploy:netlify` and `build:netlify` tasks from `turbo.json`
- [ ] Remove the `case 'netlify'` branch and the `@astrojs/netlify` import from
      `astro.config.mjs`, and drop the dependency
- [ ] Delete the Netlify project itself **last**, after all of the above

Then verify Netlify is out of the request path entirely:

```bash
for u in https://semantius.com/docs/cli          "https://semantius.com/pricing?a=1"          https://www.semantius.com/docs/cli/; do
  printf '%-44s ' "$u"
  curl -sS -o /dev/null -w '%{http_code} -> %{redirect_url}
' "$u"
done

# want no output
curl -sSI https://www.semantius.com/docs/cli/ | grep -i 'x-nf-request-id'
```

### Twin pipeline debt

Carried over from the markdown-twins implementation. None of it blocks
anything; all of it is the kind of thing that goes wrong silently.

- **The "claimed by the route writer" check is a heuristic.** `integration.ts`
  decides whether to extract a page by testing whether its `.md` already exists
  with an mtime at or after the build start. It was observed failing once,
  reporting `176 twins (176 from source, 0 extracted)` while Tier B had silently
  done nothing for 39 pages. Failure modes: anything touching `dist` mid-build,
  the one-second slack window, and `buildStart` staying `0` if
  `astro:build:start` never fires. The route writer already knows the exact set
  it claimed (the `seen` set in `src/pages/[...twin].md.ts`); persist that and
  read it here. A coverage report that can be confidently wrong is worse than
  none.
- **The Tier C staleness check was specified and never built.** An override in
  `src/data/twin-overrides/` is served verbatim forever, and nothing tells you
  it drifted from the page. As specified: store the sha256 of what Tier B
  *would* have extracted (before nav injection and `normalizeUnicode`) in the
  override's frontmatter, recompute at build, and **print the new value on
  mismatch** or nobody can regenerate it. Also strip that frontmatter before
  serving. Moot while the directory is empty; urgent the moment the pricing
  override lands, which is the one case it was designed for.
- **`getBlueprintSources()` filters out a source whose body came back empty.**
  That is exactly the workerd zero-byte regression the build is supposed to
  catch, turned into silence. Log it.
- **The size-floor warning fires on deliberate Tier C overrides**, which are a
  decision rather than extraction failing.
- **`/contact.md` says "Fill out the form below" and then has no form**, because
  `form` is in `DROP_TAGS`. The page's contact details are placeholder copy
  anyway (`support@interstellar.com`, "Endurance / Interstellar Space Station"),
  so fix the page first.
- **Housekeeping.** `apps/web/README.md` still has no third-party / dualmark /
  Apache-2.0 mention, which was a stated licence deliverable (the vendored
  licence text, `NOTICE`, pinned upstream SHA and per-file headers are all in
  place). `toHtmlPath`, `isMarkdownPath`, `toMarkdownUrl` and `allOverridePaths`
  are exported with no consumers, and `toHtmlPath`'s comment claims the coverage
  report uses it, which it does not. `Cache-Control: public, max-age=3600`
  applies to the HTML 404 served for a missing `.md`, so an agent that guesses a
  twin URL an hour before it ships caches the 404.

---

## Decisions waiting on a human

| | |
|---|---|
| **Real pricing terms** | The release shipped with the twin held, so this no longer blocks anything — but the live HTML page still states a 14-day trial, PayPal/wire payment and a 30-day money-back guarantee. See the top of this file. |
| **`Accept: text/markdown` handling** | Agents that content-negotiate instead of reading `rel="alternate"` currently get HTML. Two options: Cloudflare's "Markdown for Agents" toggle (machine conversion of the rendered page) or a zone Redirect Rule matching the Accept header and redirecting to our own twin. The second serves better content and still costs no Worker invocation; plan availability of `http.request.headers` in Redirect Rules is unconfirmed. |
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

**Twin fidelity, 2026-09-22.** Three audits over all 231 twins, then the fixes:
the install command and deploy prompt now have one definition each rather than
one per renderer; the `system_name` / module-code join that matched 0 of 56 is
fixed in four places; images, capability lists, blueprint siblings and 25
misattributed paragraphs are back; the breadcrumb ends with the page. Every
build now compares each source-derived twin against markdown extracted from the
page it shipped with, and warns about what the page says and the twin does not.
See CONTEXT-MEMORY.md for the rules that came out of it.

---

## Related files

| File | What it holds |
|---|---|
| `todo.md` | This file. Everything still open, with the detail inlined: the `aeo-*.md` working files it used to link to were deleted on 2026-09-22 once their plans had shipped. `git log -- aeo-next-session.md` recovers them. |
| `CONTEXT-MEMORY.md` | Architecture and environment knowledge that outlives any one task. Read before starting work. |
