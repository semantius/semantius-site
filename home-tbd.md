# Home Page v1: TBD List

What is still open in the founder's v1 specification for the hub, the three
landing pages and the six sample-prompt pages, built on branch `home-v1`. Every
item must be resolved before the branch goes live.

- **Part A** lists gaps: content the spec relies on that does not exist. Each
  one shows a visible TBD label on the preview.
- **Parts B and C** are built exactly as specified, but need a decision first.
- Choices that depart from the spec, including your answers to D15 to D22, are
  in `home-deviations.md`.

Item numbers continue those of the first review of the spec, so A1 to C14 mean
the same as before. A7 and B15 are new.

**Preview:** added after the first preview deploy.

## A. Gaps: Content That Does Not Exist

**A1. The demo (§4.5, reused on Agent guardrails in §5.3).** Missing: the
recorded walkthrough of the four steps, the log lines for step 4, and the four
"Show the code" artifacts (the model definition; the Postgres schema, the
approval step and the permission on it; the PostgREST `curl` request and its
response; the generated React form). If the platform behaves differently from
the four steps, the spec says the step text changes to match the recording.
Pages: hub, Agent guardrails.

**A2. What each sample prompt's result includes (§8).** Three short bullets per
page, 18 in all. None are written. Pages: all six sample-prompt pages.

**A3. Docs pages that do not exist (§5, §6, §7, §4.11).** No page exists for:

- row-level security (Agent guardrails). `/docs/business-logic` covers
  row-level filters, but there is no page on row-level security;
- importing data (CRM and operations);
- approval steps (CRM and operations);
- customizing the app (Apps);
- module export (Apps);
- the docs quickstart (footer). Only the self-hosting quick start exists.

The docs links that do resolve are listed in `home-deviations.md`.

**A4. Footer articles (§4.11).** None of the three posts exists on the blog. The
spec hides an unpublished title, which leaves the groups "Agent safety and
architecture" and "Agents and connected data" empty. The preview shows each
group heading with a TBD label. Needed: the posts, or a decision to hide an
empty group. Pages: the footer of every page.

**A5. llms.txt (§10).** Not written: the paragraph on what Semantius is, and
each page's one-sentence summary with its qualifier (hub, three landing pages,
six prompt pages). Also open: whether the current product text in
`apps/web/src/data/llms-intro.md` goes (it names MCP servers, dashboards, Neon
and Supabase), and whether the generated index of docs, blueprints, skills and
blog posts stays below the new content. Page: `/llms.txt`.

**A6. /about (§4.11).** The paragraph is added at the top of the existing page,
with a TBD label. Open: whether it replaces the page instead. The page's other
text names MCP servers, dashboards, Neon and Supabase. Page: `/about`.

**A7. Meta descriptions (§10).** The spec gives a description for the hub only.
The three landing pages and the six prompt pages fall back to the site-wide
default description until theirs are written. A meta description has no place
on the page, so this gap carries no visible label.

## B. Built as Specified: the Spec Contradicts Itself

**B7. Search terms (§10) that are not in the copy.** The spec requires these
terms in each page's copy, while forbidding added claims and keyword lists. They
cannot be placed without sentences from you.

- **Hub:** "a UI for your team". "PostgreSQL" appears only in the graphic's
  technical names.
- **Agent guardrails:** "AI agent guardrails", "deterministic guardrails for AI
  agents", "system of record for AI agents", "database for always-on AI
  agents", "human-in-the-loop approvals", "Directus alternative".
- **CRM and operations:** no agent is named ("build a CRM with Meta Muse, OpenAI
  Dots or Grokbot"), "one customer record across sales and support", "Power
  Apps alternative".
- **Apps:** "self-hosted Airtable alternative for AI agents", "relational
  Airtable replacement", "SmartSuite alternative", "auto-generated React UI
  from Postgres", "PostgREST admin UI", "Retool alternative", "Bubble
  alternative".

**B8. llms.txt, "what Semantius is not" (§10).** "Not analytics, not an agent"
collides with the never-write list (§3): "analytics", and "not another agent"
spelled out. Built as specified.

**B9. The limit question in the FAQ (§4.9).** "Until your next month's credits
arrive, you top up, or you move to a larger plan." Free has no top-ups, and
Starter and Pro are not open yet, so today a Free workspace can only wait for
next month's credits. The hub also says "pauses" where `/pricing` says "stops".

**B10. Structured data (§10).**

- schema.org defines `codeRepository` on `SoftwareSourceCode` only, so it is not
  a valid property of `SoftwareApplication`. Built as specified.
- "The repository" is not named. Built with `https://github.com/Semantius`, the
  GitHub link the footer uses (§4.11), which is the organization rather than a
  repository. Its public code repositories include `semantius`,
  `semantius-cli`, `semantius-app`, `semantius-idp` and `semantius-self-hosted`.
- "An offer for Free ($0) only" is applied to the hub. `/pricing` still lists
  all three plans.

**B11. "No page contains any wording from the Never write list" (§11).** Built
for the pages in this spec. Elsewhere the site still uses banned wording: "MCP"
in `/features`, the rest of `/about` and much of the docs (a whole MCP
connectors section); "analytics" in several docs pages; Neon and Supabase in
`/about` and the pg_semantius docs. The generated index kept in `/llms.txt`
(A5) repeats some of it: the MCP connectors docs, "analytics" in a blueprint's
description, and "the only" in a blog post's.

**B15. Sign-up paths contradict "Free is open now".** The spec's Start free
buttons go to the Free sign-up. The header's Sign up button and the announcement
banner (kept on every page by your answer to D18) both open the wait list, and
the banner says the public beta starts in late October. The spec covers neither
the header button nor the banner text.

## C. Built as Specified: the Spec Differs From the Product

**C12. The skill install command (§4.5).** The spec gives
`npx skill install https://github.com/semantius/semantius-cli`. The docs and the
rest of the site use `npx skills add semantius/semantius-cli --all --global`.
Built as specified.

**C13. No step connects the CLI to a workspace (§4.5, §11).** The two install
steps never sign the CLI in, so "reproduce the demo in under ten minutes" cannot
be met as written. The docs get credentials through the Ops MCP connector, a word
the spec bans. The CLI's README now has `semantius login`, a browser sign-in.
Windows has its own installer (PowerShell), which the spec does not show.

**C14. Directus's license (§3, §4.9, §5.3), checked at the source.**

- Correct: Directus's pricing page says "Organizations under $5M in annual
  revenue and fewer than 50 employees qualify for fully permissive access".
- Correct: the license changed twice since 2023, to BSL 1.1 in April 2023 and to
  the Monospace Sustainable Core License (MSCL-1.0-GPL) on May 28, 2026.
- Not supported by the source: "Above that, it needs a commercial license, even
  self-hosted." MSCL permits internal use at any company size, and puts
  "protected functionality" behind a license key. Above the threshold, what a
  company pays for is that key, not the right to run Directus.
