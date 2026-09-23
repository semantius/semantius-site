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

### Write the summary line for an agent, not for a search result

Every markdown copy opens with a one-line abstract of the page. Today that line
is the page's meta description - the sentence written to sell the page in a
Google result. Neon, whose markdown copies this site's format is modeled on,
puts something different in that slot: a summary written for a machine deciding
whether the page is worth opening at all.

Theirs, on their Next.js guide:

> Summary: Connection guide for wiring a Next.js application to Neon serverless
> Postgres using node-postgres, postgres.js, or the Neon serverless driver.
> Choose this page when you need working DATABASE_URL setup and driver code for
> App Router (Server Components, Server Actions), Pages Router, Serverless
> Functions, or Edge Functions. The guide also explains Next.js static render
> caching and the force-dynamic workaround.

Three things make that work: it says what the page covers, it says **when to
choose it** over a similar page, and it names things on the page the title does
not imply. Three to five sentences, concrete nouns, nothing sold.

Ours, on `/docs/reference.md`, currently reads "Detailed documentation for
models, business logic, MCP connectors, agent skills and the CLI." True, and no
help to anyone deciding whether to open it.

**How to build it.** `docHeader()` in `apps/web/src/lib/dualmark/compose.ts`
renders that line from the page description. Give it a second, optional field
that falls back to the description when it is missing, so every page nobody has
written a summary for behaves exactly as it does today. Then:

- **Docs and blog pages** carry it in their frontmatter, next to title and
  description; add the field to the schemas in
  `apps/web/src/content.config.ts`. It must **not** appear on the HTML page. It
  is not marketing copy, and showing it invites the next person to rewrite it
  into a sales line.
- **Blueprints** should have it generated rather than written 56 times by hand.
  The name, the domain and the entity count already say what each model covers.
- **Pages whose copy is extracted from HTML** (marketing, skills, domains) have
  no source file to read it from. Leave those on the meta description, or keep a
  short list of hand-written summaries next to
  `apps/web/src/data/twin-overrides/`.

**Before starting:** this is a writing job far more than a coding one, it is
blocked on nothing, and the build's page-versus-copy check will not complain
either way, because it compares body text and ignores the header.

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

**Background, because none of this reads sensibly without it.** Every page on
this site is published twice: the normal HTML page, and a plain-markdown copy of
it at the same address with `.md` on the end (`/docs/cli` and `/docs/cli.md`).
The markdown copy is what AI agents and answer engines read. A copy is produced
in one of three ways:

1. **From the page's own source file.** Docs, blog posts and blueprints are
   written in markdown already, so the copy is built from that source.
2. **Extracted from the finished HTML page.** Marketing pages, skill pages and
   domain pages have no single source file, so after the site is built their
   copy is made by converting the rendered page back into markdown.
3. **Hand-written.** Any page's copy can be replaced by a file checked in at
   `apps/web/src/data/twin-overrides/`. Nothing uses this today.

Nothing below breaks the site. Every item is something that fails **quietly**,
which is why it is written down rather than left to be noticed.

#### 1. The build can skip a fifth of the copies and still report success

Ways 1 and 2 above are carried out by two different pieces of code, and they
have to agree on who handles which page. The second one decides
"has the first already written this page?" by looking at the file's timestamp:
if a `.md` file exists and was modified after the build started, it assumes yes
and moves on.

That assumption has been wrong at least once. A build reported
`176 markdown twins (176 from source, 0 extracted)` - meaning 39 pages that
should have had a copy generated from their HTML got nothing at all, while the
build reported success. It also breaks if anything else writes into the output
folder mid-build, if a file lands inside the one-second tolerance, or if the
build-start hook never fires, in which case the recorded start time stays at
zero, every file looks newer than it, and every page looks already-handled.

**Fix.** The first writer already knows exactly which pages it wrote; it holds
that list while running, in `apps/web/src/pages/[...twin].md.ts`. Save the list
and have `apps/web/src/lib/dualmark/integration.ts` read it, instead of
inferring it from timestamps. Small job. A coverage report that can be
confidently wrong is worse than no report at all.

#### 2. A hand-written copy can drift away from its page forever

Once a page's copy is hand-written, that file is served exactly as written for
as long as it exists. If the page it mirrors changes, nothing notices and
nothing warns. The original plan included a check for this. It was never built.

**Fix, as it was specified.** Store a fingerprint (a sha256) of the text the
build *would* have extracted from the page inside the hand-written file,
recompute it on every build, and warn when the two no longer match. Two details
decide whether that is useful or ornamental:

- Fingerprint the raw extracted text, **before** the header and footer are added
  and before the punctuation is ASCII-folded. Otherwise it changes for reasons
  that have nothing to do with the page changing, and every build warns.
- **Print the new fingerprint in the warning.** Without it nobody can update the
  file by hand, so the check becomes noise and gets disabled.

Strip the fingerprint out again before the file is served, so readers do not
receive build metadata inside their document.

All theoretical while that folder is empty. It becomes real the moment the
pricing copy at the top of this file is hand-written, which is exactly the case
it was designed for: a stale hand-written page means agents quoting prices we no
longer charge.

#### 3. A blueprint whose text fails to load is dropped instead of reported

`getBlueprintSources()` in `apps/web/src/lib/dualmark/manifest.ts` skips any
blueprint whose body came back empty. Empty is not a normal state - it is the
signature of a known build failure in which reading a file returns nothing
instead of raising an error (CONTEXT-MEMORY.md, "The site is fully static").
Skipping it means a build quietly ships 55 blueprints instead of 56 and calls
that success. It should fail, or at the very least name every blueprint it
dropped.

#### 4. The "this copy looks too small" warning cries wolf

The build warns about any copy under 200 bytes, on the assumption that the
extraction found nothing. A hand-written copy is a deliberate decision and is
allowed to be short, so it should be exempt from that warning. A warning that
fires on correct files is one people learn to scroll past - which is how several
items on this page went unnoticed for months.

#### 5. The contact page promises a form its markdown copy cannot contain

`/contact.md` says "Fill out the form below" and then has no form. The missing
form is correct: form controls are deliberately removed from the markdown
copies, because an agent reading a text file cannot fill one in. The sentence is
what is wrong.

Fix the page itself first, though - its contact details are still template
placeholders: `support@interstellar.com`, `+1 (555) 123-4567`, and "Endurance /
Interstellar Space Station". Then reword the sentence so it is true in both
versions, for instance by giving the email address in the text instead of
pointing at a form.

#### 6. Housekeeping

- **Licence attribution.** `apps/web/README.md` does not mention that part of
  this code is adapted from the dualmark project under Apache-2.0. Everything
  else that license requires is already in place: the license text is vendored,
  `NOTICE` exists, the upstream commit is pinned, and the individual files carry
  headers. Only the README line is missing.
- **Four exported functions that nothing calls.** `toHtmlPath`,
  `isMarkdownPath` and `toMarkdownUrl` in
  `apps/web/src/lib/dualmark/paths.ts`, and `allOverridePaths` in
  `manifest.ts`. The comment on `toHtmlPath` claims the coverage report uses it;
  it does not. Delete them.
- **A missing `.md` file is cached as missing for an hour.** Asking for a
  markdown copy that does not exist returns the HTML 404 page with
  `Cache-Control: public, max-age=3600`. An agent that guesses a URL an hour
  before that page ships caches the failure and does not come back. Missing
  `.md` paths need a short cache lifetime, or none.

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
