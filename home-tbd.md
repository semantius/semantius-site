# Home Page v1.4: TBD List

What is still open in the founder's v1 specification, as amended by change
request 1 (the hub and the landing pages), change request 2 (the hub's
specifications section), change request 3 (the solution pages, rebuilt by
search intent) and change request 4 (hub card 3 and Business apps, without
brand names), built on branch `home-v1.4`. Every item must be resolved before
the branch goes live.

- **Part A** lists gaps: content the spec relies on that does not exist. Each
  one shows a visible TBD label on the preview.
- **Parts B and C** are built exactly as specified, but need a decision first.
- **Part D** lists questions on the change requests that did not block the
  build.
- Choices that depart from the spec, including your answers, are in
  `home-deviations.md`.

An item keeps its number while it stays open, so A1 to C18 mean the same as in
the review of the v1 build. B23 to B25 and D26 to D29 are new with change
request 1; B30, B31, C32, D33 and D34 with change request 2; C35 and C36 with
change request 3, which also reopens part of B9. Change request 4 adds no
gap: everything it changes has its copy.

The specs are in `C:\dev\pgext-research`: `homepage-spec-v1.md`,
`homepage-spec-v1-cr1.md` to `-cr4.md` and `seo-intents-v0.md`.

**Closed by change request 1:**

- A3's footer item: the footer links "Docs" to `/docs/overview`.
- A4's decision: an unpublished title is shown with a TBD label, not hidden.
- A5's paragraph on what Semantius is.
- B15 for the header and the phone menu: both Sign up buttons go to the sign-up
  page.
- B17: on the hub, technology names appear only in the specifications section
  and the footer, and the only code is the demo's rule.

**Closed by change request 2:**

- B9 and C18 on the hub: the limits and support lines left it.
- B23: the hub's specification table is gone, so one table remains.
- B16's "the outcome is bounded, not determined": "Outside these contracts"
  now says what the checks do not guarantee.

**Closed by change request 3 and your answers to it:**

- B7 for the solution pages: §7's term lists replace spec v1's, and each term is
  in the given copy. The search-term TBD on Agent guardrails gave way to the
  specification line.
- B24: the prompt pages keep their install steps (`home-deviations.md`, 47).
- C14 and D34: the Directus comparison is gone. Back end carries one license
  line, from the facts you settled (§9).
- D26: the six prompt cards are split three and three, by reader.
- D27: the menu and the grid list the pages in the same order.
- D29: the specs are in `C:\dev\pgext-research`.
- A5 and A7 for the solution pages: their llms.txt summaries and meta
  descriptions are given.

**Preview:** https://homev-20261002225759-semantius-site.ma532.workers.dev

Pages that carry TBD labels. The footer is on every page and carries A4.

- [Hub](https://homev-20261002225759-semantius-site.ma532.workers.dev/): A1
- [Agent guardrails](https://homev-20261002225759-semantius-site.ma532.workers.dev/solutions/agent-guardrails): A1, A3
- [Back end](https://homev-20261002225759-semantius-site.ma532.workers.dev/solutions/backend): A3
- [Business apps](https://homev-20261002225759-semantius-site.ma532.workers.dev/solutions/business-apps): A3
- Sample prompts, A2:
  [agency](https://homev-20261002225759-semantius-site.ma532.workers.dev/prompts/agency-client-tracker),
  [field service](https://homev-20261002225759-semantius-site.ma532.workers.dev/prompts/field-service-jobs),
  [rentals](https://homev-20261002225759-semantius-site.ma532.workers.dev/prompts/rental-turnovers),
  [punch list](https://homev-20261002225759-semantius-site.ma532.workers.dev/prompts/punch-list),
  [purchase approvals](https://homev-20261002225759-semantius-site.ma532.workers.dev/prompts/purchase-approvals),
  [equipment register](https://homev-20261002225759-semantius-site.ma532.workers.dev/prompts/equipment-register)
- [/about](https://homev-20261002225759-semantius-site.ma532.workers.dev/about): A6
- [/llms.txt](https://homev-20261002225759-semantius-site.ma532.workers.dev/llms.txt): A5, as TBD text

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
  puts code on the page beyond the one rule.

Pages: hub, Agent guardrails.

**A2. What each sample prompt's result includes (§8).** Three short bullets per
page, 18 in all. None are written. Pages: all six sample-prompt pages.

**A3. Docs pages that do not exist (change request 3, §3.3, §4.4 and §5.8).**
Each link shows its label with a TBD. No page exists for:

- row-level security (Agent guardrails). `/docs/business-logic` covers
  row-level filters, but there is no page on row-level security;
- customizing the app (Back end);
- module export (Back end);
- importing data (Business apps);
- approval steps (Business apps).

§5.8 gives Business apps two docs links "because no other existing docs page
fits its readers", but neither of the two has a page. The docs links that do
resolve are listed in `home-deviations.md`.

**A4. Footer articles (change request 1, §8).** None of the four posts exists on
the blog. Each title shows with a TBD label until its post is published.

- Agent Safety & Architecture: "How to build approval rules for AI agents with
  JSONLogic inside PostgreSQL" and "Rules in a prompt versus rules in Postgres:
  what your agent actually follows".
- Database-Driven Minimalism: "Why your agent can't connect a ticket to usage
  and lead status, and what fixes it" and "What Klarna actually did: unify
  first, and fewer tools follow".

Pages: the footer of every page.

**A5. llms.txt (§10).** The paragraph on what Semantius is opens the file
(change request 1, §11), and the three solution pages carry their summaries
(change request 3, §7). Still not written: the one-sentence summary with its
qualifier for the hub and the six prompt pages. Also open:

- whether removing the old product text from `apps/web/src/data/llms-intro.md`
  is right (it named MCP servers, dashboards, Neon and Supabase;
  `home-deviations.md` 21);
- whether the generated index of docs, blueprints, skills and blog posts stays
  below the new content;
- whether the section "Agents it works with" stays. It is the hub FAQ's answer
  to "Which agent do I need?", the FAQ has left the hub, and the opening
  paragraph names the same agents.

Page: `/llms.txt`.

**A6. /about (§4.11).** The paragraph is added at the top of the existing page,
with a TBD label. Open: whether it replaces the page instead. The page's other
text names MCP servers, dashboards, Neon and Supabase. Page: `/about`.

**A7. Meta descriptions (§10).** The six prompt pages fall back to the site-wide
default description until theirs are written. A meta description has no place
on the page, so this gap carries no visible label.

## B. Built as Specified: the Spec Contradicts Itself

**B7. Search terms not in the copy.**

- **Hub (spec v1 §10):** "a UI for your team". The copy says "an app for your
  team".
- **Change request 3, §7:** two terms are not in the copy word for word.
  "Always-on agents": challenge 8 says "An always-on agent" and part 2 "your
  always-on agent". "JSONLogic in PostgreSQL": §4.1 says "JSONLogic
  expressions, stored and evaluated in PostgreSQL". §7 says not to add text for
  a term, so both are built as given.

**B8. llms.txt, "what Semantius is not" (§10).** "Not analytics, not an agent"
collides with the never-write list (§3): "analytics", and "not another agent"
spelled out. Built as specified.

**B9. "Pauses" against "stops" (change request 3, §5.6).** Business apps says
that at its limits "a workspace pauses with all your data kept"; `/pricing` says
"your database stops". Reopened by change request 3. The other half of the old
B9 is fixed: top-ups are now offered on paid plans only.

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
for the pages in the specs. Elsewhere the site still uses banned wording: "MCP"
in `/features`, the rest of `/about` and much of the docs (a whole MCP
connectors section); "analytics" in several docs pages; Neon and Supabase in
`/about` and the pg_semantius docs. The generated index kept in `/llms.txt`
(A5) repeats some of it: the MCP connectors docs, "analytics" in a blueprint's
description, and "the only" in a blog post's. `/about` also has a second
category term in its title, "About - Semantius Agentic Data Platform" (§3
allows only "the agent-first data platform"), which `/llms.txt` repeats, and
its copy says "the people who run the business", close to the banned "run your
business".

**B15. The announcement banner contradicts "Free is open now".** Both Sign up
buttons go to the sign-up page, and the banner stays as it is (change request
1, §9). On every page, it opens the wait list and says the public beta starts
in late October.

**B16. Copy that lacks a qualifier spec v1 §3 requires.** The change requests'
copy, used word for word, lacks these:

- **Hub:** "There are no built-in connectors to other tools" ("Real-time actions
  on live records" and "Unified context ingestion"); "Pro cloud features
  aren't MIT" ("Yours to keep"); "Free allows up to 5 users, and agents count
  as users" (routing card 3, "Paid plans aren't priced per user").
- **Business apps:** "No offline mode and no installable app" (the lead and "An
  app for the whole team", "with nothing to install").

The hub's "Outside these contracts" also lacks an item that Agent guardrails
has (B31).

**B25. The hub's title and meta description say "Postgres".** The hub names no
technology above the specifications section, but neither is visible copy, and
no change request mentions them, so both are unchanged: "Semantius: the
agent-first data platform on open-source Postgres", and a description that says
"enforced in Postgres".

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
The command is on the six prompt pages and in llms.txt.

**C13. No step connects the CLI to a workspace (§4.5, §11).** The two install
steps never sign the CLI in. The docs get credentials through the Ops MCP
connector, a word the spec bans. The CLI's README now has `semantius login`, a
browser sign-in. Windows has its own installer (PowerShell), which the spec does
not show. Remains wherever C12 does.

**C32. "JSON modules" as a way to bring data in (change request 2, §2).**
"Existing data comes in through CSV import and JSON modules." The docs do not
say that a module's JSON carries records, and Back end describes it as the
model: "export a module as JSON, review it in a pull request, and promote it
from development to production." Needed: confirmation that a JSON module brings
in existing data. Built as specified.

**C35. The app's self-hosted features (change request 3, §4.2).** "Theming,
per-view overrides, chart plugins and config-driven menus", and an app "you can
host on any static host or CDN". The docs describe only an account-menu setting
(`VITE_UI_CUSTOMIZER`, `/docs/self-hosted/settings`). Needed: confirmation.
Built as specified.

**C36. A docs page contradicts the access facts (change request 3, §9).**
`/docs/pg-semantius` says: "Nothing can go around the rules. An agent, a
script, a SQL client, and a second API all pass through the same checks." Your
facts say access is only through the REST API, and direct database access
bypasses Semantius. "Nothing can go around it" is also on the never-write list.
Outside the home pages.

## D. Questions on the Change Requests

**D28. "Read the architecture manifesto" (§2)** leads to the specifications
section, which change request 2 makes an explanation of the architecture. Still
open: nothing on the page is called a manifesto. Built as specified.

**D33. The hub's body has no pricing.** Change request 2 removed the plans from
the hub. Business apps now carries them (change request 3, §5.6), and the hub's
card 3 says "Paid plans aren't priced per user", but the hub links neither
/pricing nor Notify me. Built as specified.
