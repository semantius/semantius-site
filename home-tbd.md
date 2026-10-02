# Home Page v1.2: TBD List

What is still open in the founder's v1 specification, as amended by change
request 1 (the hub and the three landing pages) and change request 2 (the hub's
specifications section), built on branch `home-v1.2`. Every item must be
resolved before the branch goes live.

- **Part A** lists gaps: content the spec relies on that does not exist. Each
  one shows a visible TBD label on the preview.
- **Parts B and C** are built exactly as specified, but need a decision first.
- **Part D** lists questions on the change requests that did not block the
  build.
- Choices that depart from the spec, including your answers to D15 to D22, are
  in `home-deviations.md`.

An item keeps its number while it stays open, so A1 to C18 mean the same as in
the review of the v1 build. B23 to B25 and D26 to D29 are new with change
request 1; B30, B31, C32, D33 and D34 with change request 2.

**Closed by change request 1:**

- A3's footer item: the footer links "Docs" to `/docs/overview`.
- A4's decision: an unpublished title is shown with a TBD label, not hidden.
- A5's paragraph on what Semantius is.
- B15 for the header and the phone menu: both Sign up buttons go to the sign-up
  page.
- B17: on the hub, technology names appear only in the specifications section
  and the footer, and the only code is the demo's rule.

**Closed by change request 2:**

- B9 and C18: the limits and support lines left the hub, their only place.
- B23: the hub's specification table is gone, so one table remains.
- B16's "the outcome is bounded, not determined": "Outside these contracts"
  now says what the checks do not guarantee.

**Preview:** https://homev-20261002173922-semantius-site.ma532.workers.dev

Pages that carry TBD labels. The footer is on every page and carries A4.

- [Hub](https://homev-20261002173922-semantius-site.ma532.workers.dev/): A1
- [Agent guardrails](https://homev-20261002173922-semantius-site.ma532.workers.dev/solutions/agent-guardrails): A1, A3, B7
- [CRM and operations](https://homev-20261002173922-semantius-site.ma532.workers.dev/solutions/crm): A3
- [Apps](https://homev-20261002173922-semantius-site.ma532.workers.dev/solutions/airtable-alternative): A3
- Sample prompts, A2:
  [agency](https://homev-20261002173922-semantius-site.ma532.workers.dev/prompts/agency-client-tracker),
  [field service](https://homev-20261002173922-semantius-site.ma532.workers.dev/prompts/field-service-jobs),
  [rentals](https://homev-20261002173922-semantius-site.ma532.workers.dev/prompts/rental-turnovers),
  [punch list](https://homev-20261002173922-semantius-site.ma532.workers.dev/prompts/punch-list),
  [purchase approvals](https://homev-20261002173922-semantius-site.ma532.workers.dev/prompts/purchase-approvals),
  [equipment register](https://homev-20261002173922-semantius-site.ma532.workers.dev/prompts/equipment-register)
- [/about](https://homev-20261002173922-semantius-site.ma532.workers.dev/about): A6
- [/llms.txt](https://homev-20261002173922-semantius-site.ma532.workers.dev/llms.txt): A5, as TBD text

## A. Gaps: Content That Does Not Exist

**A1. The demo's artifacts (change request 1, §4; on Agent guardrails by
§10.1).** Missing: one real Semantius workspace with the demo model, and the
five artifacts taken from it. The model is the module Sales with Clients and
Quotes; the Quotes fields client, title, hours and status; the steps draft,
waiting for approval, approved or declined; the rule that hours must be greater
than 0; and the roles owner and agent. The artifacts are the model view, the
rule's text, the refusal as the agent received it, the app screenshot with the
owner's Approve button, and the log entries. Each shows a TBD in its place.

Also open:

- The change request has no rule for a workspace that behaves differently from
  the caption, for example an app that shows a status field rather than an
  Approve button, or a refusal that does not name the permission. The v1 rule
  (the text changes to match the recording) went with the walkthrough.
- If the refusal reaches the agent as a JSON error, showing it word for word
  puts code on the page beyond the one rule (§13).

Pages: hub, Agent guardrails.

**A2. What each sample prompt's result includes (§8).** Three short bullets per
page, 18 in all. None are written. Pages: all six sample-prompt pages.

**A3. Docs pages that do not exist (§5, §6, §7).** The landing pages keep their
docs links (change request 1, §3 and §10). No page exists for:

- row-level security (Agent guardrails). `/docs/business-logic` covers
  row-level filters, but there is no page on row-level security;
- importing data (CRM and operations);
- approval steps (CRM and operations);
- customizing the app (Apps);
- module export (Apps).

The docs links that do resolve are listed in `home-deviations.md`.

**A4. Footer articles (change request 1, §8).** None of the four posts exists on
the blog. Each title shows with a TBD label until its post is published.

- Agent Safety & Architecture: "How to build approval rules for AI agents with
  JSONLogic inside PostgreSQL" and "Rules in a prompt versus rules in Postgres:
  what your agent actually follows".
- Database-Driven Minimalism: "Why your agent can't connect a ticket to usage
  and lead status, and what fixes it" and "What Klarna actually did: unify
  first, and fewer tools follow".

Pages: the footer of every page.

**A5. llms.txt (§10).** The paragraph on what Semantius is now opens the file
(change request 1, §11). Still not written: each page's one-sentence summary
with its qualifier (hub, three landing pages, six prompt pages). Also open:

- whether removing the old product text from `apps/web/src/data/llms-intro.md`
  is right (it named MCP servers, dashboards, Neon and Supabase;
  `home-deviations.md` 21);
- whether the generated index of docs, blueprints, skills and blog posts stays
  below the new content;
- whether the section "Agents it works with" stays. It is the hub FAQ's answer
  to "Which agent do I need?", the FAQ has left the hub, and the new paragraph
  names the same agents.

Page: `/llms.txt`.

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

- **Hub:** "a UI for your team". The copy says "an app for your team".
  "PostgreSQL" is now in the specifications section.
- **Agent guardrails:** "enforce AI agent permissions in Postgres", "AI agent
  guardrails", "deterministic guardrails for AI agents", "system of record for
  AI agents", "database for always-on AI agents", "JSONLogic in PostgreSQL",
  "row-level security for AI agents", "human-in-the-loop approvals", "Directus
  alternative". Change request 1 (§10.1) adds "secure database runtime for
  LLMs" to the page copy without a sentence, so the page shows a TBD label
  under its lead.
- **CRM and operations:** "custom CRM built with your AI agent"; no agent is
  named ("build a CRM with Meta Muse, OpenAI Dots or Grokbot"); "one customer
  record across sales and support"; "Power Apps alternative".
- **Apps:** "open-source Airtable alternative", "self-hosted Airtable
  alternative for AI agents", "relational Airtable replacement", "SmartSuite
  alternative", "auto-generated React UI from Postgres", "PostgREST admin UI",
  "Retool alternative", "Bubble alternative".

Some of these are close to a page's title (for example "Open-source Airtable
alternative" in the Apps title), but none is in the page's copy.

**B8. llms.txt, "what Semantius is not" (§10).** "Not analytics, not an agent"
collides with the never-write list (§3): "analytics", and "not another agent"
spelled out. Built as specified.

**B10. Structured data (§10).**

- schema.org defines `codeRepository` on `SoftwareSourceCode` only, so it is not
  a valid property of `SoftwareApplication`. Built as specified.
- "The repository" is not named. Built with `https://github.com/Semantius`, the
  GitHub link the footer uses, which is the organization rather than a
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
description, and "the only" in a blog post's. `/about` also has a second
category term in its title, "About - Semantius Agentic Data Platform" (§3
allows only "the agent-first data platform"), which `/llms.txt` repeats, and
its copy says "the people who run the business", close to the banned "run your
business".

**B15. The announcement banner contradicts "Free is open now".** Change request
1 (§9) sends both Sign up buttons to the sign-up page and keeps the banner as it
is. On every page, the banner opens the wait list and says the public beta
starts in late October.

**B16. The hub's copy lacks qualifiers the spec requires.** §3 says a claim on
the hub carries its short qualifier, and §10 that every claim carries its
qualifier. The change requests' copy, used word for word, lacks two of the §3
table's:

- "There are no built-in connectors to other tools" ("Real-time actions on live
  records" and "Unified context ingestion" in the specifications section);
- "Pro cloud features aren't MIT" ("Yours to keep").

The hub's "Outside these contracts" also lacks an item that Agent guardrails
has (B31).

**B24. Install commands on the prompt pages.** §13 says no page shows install
commands. The change request does not mention the six sample-prompt pages,
which still show the two install steps, so they are kept. If they go, C12 and
C13 remain only in the llms.txt Install section.

**B25. The hub's title and meta description say "Postgres".** §13 says the hub
names no technology above the specifications section. Neither is visible copy,
and the change request does not mention them, so both are unchanged: "Semantius:
the agent-first data platform on open-source Postgres", and a description that
says "enforced in Postgres".

**B30. "Dimensions and measures" (change request 2, §2).** The specifications
section says every entity carries them and the agent can read them. In the
docs they belong to the semantic layer for analytical queries (`/docs/overview`:
"analytical queries through a semantic layer that understands measures,
dimensions, and joins"). "Analytics" is on the never-write list, and llms.txt
says "Not analytics" (B8). Built as specified.

**B31. The guarantees, in two places.** The hub's operational contracts restate
Agent guardrails' "Deterministic checks, bounded outcomes" in other words, and
the two lists differ:

- the hub's "Outside these contracts" lacks Agent guardrails' "That a role
  doesn't take a wrong action it's allowed to take";
- Agent guardrails guarantees "Only the person who has to approve can approve",
  where the hub says "where you define who does the work and who approves it,
  the database enforces both";
- the hub adds "Changing the model requires its own permission", which the
  Agent guardrails list does not have.

Needed: one list, or the two reconciled. Built as specified.

## C. Built as Specified: the Spec Differs From the Product

**C12. The skill install command (§4.5).** The spec gives
`npx skill install https://github.com/semantius/semantius-cli`. The docs and the
rest of the site use `npx skills add semantius/semantius-cli --all --global`.
Change request 1 took the install steps off the hub and Agent guardrails; the
command remains on the six prompt pages and in llms.txt (B24).

**C13. No step connects the CLI to a workspace (§4.5, §11).** The two install
steps never sign the CLI in. The docs get credentials through the Ops MCP
connector, a word the spec bans. The CLI's README now has `semantius login`, a
browser sign-in. Windows has its own installer (PowerShell), which the spec does
not show. Remains wherever C12 does.

**C14. Directus's license, checked at the source.** On Agent guardrails, in
the comparison change request 2 moved there from the hub ("Compared with
Directus, Supabase and Airtable", the v1 FAQ answer unchanged).

- Correct: Directus's pricing page says "Organizations under $5M in annual
  revenue and fewer than 50 employees qualify for fully permissive access".
- Correct: the license changed twice since 2023, to BSL 1.1 in April 2023 and to
  the Monospace Sustainable Core License (MSCL-1.0-GPL) on May 28, 2026.
- Not supported by the source: "Above that, it needs a commercial license, even
  self-hosted." MSCL permits internal use at any company size, and puts
  "protected functionality" behind a license key. Above the threshold, what a
  company pays for is that key, not the right to run Directus.

**C32. "JSON modules" as a way to bring data in (change request 2, §2).**
"Existing data comes in through CSV import and JSON modules." The docs do not
say that a module's JSON carries records, and Agent guardrails describes it as
the model: "Export a module as JSON, review it in a pull request, and promote it
from development to production." Needed: confirmation that a JSON module brings
in existing data. Built as specified.

## D. Questions on the Change Requests

**D26. The CRM page's six prompt cards (§10.2).** Two of them, turnovers for
rentals and a punch list shared with a builder, are neither CRM nor operations,
and four repeat the "Examples" list higher on the page. Built as specified: all
six.

**D27. Names and order.** The menu and the eyebrows use the reader labels; the
breadcrumbs in the JSON-LD keep "Agent guardrails", "CRM and operations" and
"Apps" (D20). The menu lists guardrails, CRM, Apps (§9), while the routing grid
lists guardrails, Airtable alternative, CRM (§3). Built as specified.

**D28. "Read the architecture manifesto" (§2)** leads to the specifications
section, which change request 2 makes an explanation of the architecture. Still
open: nothing on the page is called a manifesto. Built as specified.

**D29. `homepage-spec-v1.md`,** which the change request names as the limit on
claims, is not in the repo. The build added no claims beyond the change request
and the copy already on the v1 pages.

**D33. The hub no longer mentions pricing.** Change request 1 moved the v1
pricing line (§4.8) into the specifications section, and change request 2
removes it. The hub's body has no plans, no "Free is open now", and no link to
Notify me or /pricing. The Start free buttons, the header's Product menu and the
banner remain. Built as specified.

**D34. "The Directus difference" on Agent guardrails (change request 2, §1).**
The comparison replaces the whole section, heading and three items, under the
label it carried on the hub, "Compared with Directus, Supabase and Airtable"
(`home-deviations.md`, 42). The page lost three statements the comparison does
not make:

- "Directus has changed its license twice since 2023. What's released under MIT
  stays MIT."
- "Leaving. Directus keeps your tables, but its permissions, Flows and app
  settings do nothing without its app server. An exported Semantius database
  keeps enforcing its rules."
- "With the database owner's or a superuser's connection: both are bypassed."
  The page's "Not guaranteed" list still names the superuser and the table
  owner.

Needed: whether any of them comes back, and whether the heading is right.
