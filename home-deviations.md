# Home Page v1: Deviations From the Spec

Every place where the build on branch `home-v1` departs from the founder's v1
specification, or decides something the spec leaves unsaid, with the reason for
each. Open questions are in `home-tbd.md`, not here.

## Decided by You

1. **Section names are visible H2 headings (D15).** The spec names a heading
   only for §4.2, §4.6 and §4.10. The hub also gets "What Semantius is", "Demo",
   "Give your agent one of these" and "Questions". Agent guardrails gets
   "Deterministic checks, bounded outcomes", "Specification", "Refusals with a
   reason", "The Directus difference", "Models as files", "Moving from another
   system" and "Demo". CRM and operations gets "The connection, by type of
   business", "Getting data in", "Fewer tools", "Approvals", "For IT" and
   "Examples". Apps gets "What you get" and "For builders". "Routing cards",
   "Pricing line", "Docs links" and "Buttons" stay unlabeled.
2. **The header gets a Solutions menu (D16).** It lists Agent guardrails, CRM
   and operations, and Apps under their §2 names, with no descriptions or
   icons. The Product menu (Features, Pricing) is unchanged. Resources is
   trimmed to Docs, Blog and Changelog as §9 says.
3. **The §4.11 footer is on every page (D17).** It adds Privacy and Terms links,
   which no page linked before, and keeps the theme toggle (the site's only
   theme switch) and the GitHub icon. The bottom line is "© Semantius by
   adenin." as specified.
4. **The announcement banner stays on every page (D18),** against §9's "The page
   carries no announcement banner."
5. **Each landing page has a cross-link row above its final buttons (D19).** It
   links the other two landing pages with the hub cards' button labels ("See how
   rules are enforced", "Build your CRM with your agent", "Build an app") and
   /pricing with "See pricing" from §4.8.
6. **Breadcrumbs are Home > Page, in the JSON-LD only (D20).** No /solutions or
   /prompts page exists to sit in between. Landing pages use their §2 names,
   prompt pages their headings.
7. **Link targets the spec leaves out (D21).** "Install the skill" (§5) goes to
   `/docs/agent-skills/installation`, "GitHub" (§5) to
   `https://github.com/Semantius`, and "Build an app" (§7) to the Free sign-up.
   The §6 examples link to the prompt pages: purchase approvals, equipment
   register, field service jobs and the agency tracker. The six hub cards (§4.7)
   take the §8 headings as their titles.
8. **The hero inverts the site theme (D22).** "Dark canvas" is built as dark on
   the light theme and light on the dark theme. The v0 "Preview" label above
   the hero is removed.

## My Choices, With Reasons

9. **"Start free" goes to `https://app.semantius.com/auth/sign-up`.** The spec
   says "the Free sign-up". That is where the Free plan's button on /pricing
   goes. "Notify me" (§4.8) opens the wait list form, as the spec says.
10. **The docs links that resolve.** "Rules and validation" goes to
    `/docs/business-logic`, which covers validation rules. "The CLI" goes to
    `/docs/cli`, "self-hosting" (§4.6, §7) to `/docs/self-hosted`, and "the
    agency sample prompt" (§6) to `/prompts/agency-client-tracker`. The others
    are TBD (`home-tbd.md`, A3).
11. **"Self-host with Dokploy" (§7) goes to `/docs/self-hosted/dokploy`.** It is
    the docs page on Dokploy, and D21 did not cover this button.
12. **The demo's "copy button for the demo prompt" (§4.5) is the docs' command
    box,** which shows the prompt with a Copy button. The spec gives the button
    no label, and this box already exists.
13. **Each §4.7 card's title links to its prompt page.** The spec gives the
    link no label.
14. **The "Show the code" tabs are labeled with the spec's four descriptions,**
    such as "The model definition". The spec gives them no shorter names.
15. **Note-form spec wording starts with a capital letter on the page,** and list
    items drop their closing semicolons. For example, §5.1's "only valid data
    under your rules;" renders as "Only valid data under your rules", and §5.3's
    "a refused change comes back..." as "A refused change comes back...".
16. **The hero is two columns on wide screens:** the text on the left, the
    graphic on the right. They stack on a phone. The second line renders as a
    large subtitle under the H1, the third line and body as paragraphs. The
    spec gives no layout.
17. **The hero graphic's toggle is a switch labeled "Show the technical names".**
    On a phone the three outputs stack under the node, without connector lines.
18. **The two copy buttons that are not command boxes show "Copied" for a
    moment:** the hero's "or copy the prompt for your agent" and the CRM page's
    "Build your CRM with your agent". The command boxes already do this, and
    without it a visitor cannot tell the click worked.
19. **The hub keeps v0's `WebSite` structured data,** which the spec does not
    name. Its `SoftwareApplication` keeps v0's `operatingSystem` ("Web") and
    `applicationCategory` ("DeveloperApplication"), and states the license as
    `https://opensource.org/licenses/MIT`.
20. **The Agent guardrails `TechArticle` carries a headline (the H1) and
    Semantius as author and publisher.** The spec names the type only. It has no
    date, because the spec gives none.
21. **llms.txt replaces the product text in `llms-intro.md` with the §10
    content.** The old text names MCP servers, Neon and Supabase, which §3 bans.
    The "Machine-readable formats" section and the generated index stay. Whether
    that is right is open (`home-tbd.md`, A5). The new sections are headed
    "Pages", "Specification", "Install", "Agents it works with" and "What
    Semantius is not", after the §10 list. The hub is listed as "Home", as in
    the breadcrumbs. "Agents it works with" is the hub FAQ's answer to "Which
    agent do I need?", word for word, since the spec gives no separate text.
22. **All v0 hub sections are gone.** "How it works", "Under the hood" and the
    v0 copy are not in the v1 spec, which describes the whole page.
23. **Buttons the spec lists without a style:** the first is solid and the rest
    are outlined, as the hero's two are (§4.1). This applies to the closing
    buttons of the three landing pages. The hub's routing card buttons (§4.4)
    are outlined.
24. **The footer says "Docs quickstart"** for §4.11's "the docs quickstart".
    The other footer labels are the spec's words.
