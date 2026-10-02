# Home Page v1.2: Deviations From the Spec

Every place where the build on branch `home-v1.2` departs from the founder's v1
specification as amended by change requests 1 and 2, or decides something they
leave unsaid, with the reason for each. Open questions are in `home-tbd.md`, not here.

Items keep their numbers so references stay valid. An item that a change
request made moot says so in one line.

## Decided by You

1. **Section names are visible H2 headings (D15).** Change request 1 names every
   heading on the hub. Agent guardrails gets "Deterministic checks, bounded
   outcomes", "Specification", "Refusals with a reason", "Models as files" and
   "Moving from another system"; its "The Directus difference" gave way to the
   comparison's heading (item 42), and its "Demo" to the live demo's (item 34). CRM and operations gets
   "The connection, by type of business", "Getting data in", "Fewer tools",
   "Approvals", "For IT" and "Examples". Apps gets "What you get" and "For
   builders". Docs links, cross-links and buttons stay unlabeled.
2. **The header gets a Solutions menu (D16).** It lists the three landing pages
   under their reader labels (change request 1, §9), with no descriptions or
   icons. The Product menu (Features, Pricing) is unchanged. Resources is
   trimmed to Docs, Blog and Changelog as §9 says.
3. **The footer is on every page (D17).** It adds Privacy and Terms links,
   which no page linked before, and keeps the theme toggle (the site's only
   theme switch) and the GitHub icon. The bottom line is "© Semantius by
   adenin." as specified.
4. **The announcement banner stays on every page (D18),** as change request 1
   (§9) confirms.
5. **Each landing page has a cross-link row above its final buttons (D19).** It
   links the other two landing pages with the hub cards' link labels from
   change request 1 (§3), without the arrow ("See how guardrails work", "Build
   your CRM with your agent", "Build a custom app"), and /pricing with "See
   pricing".
6. **Breadcrumbs are Home > Page, in the JSON-LD only (D20).** No /solutions or
   /prompts page exists to sit in between. Landing pages keep their §2 names,
   not the reader labels; prompt pages use their headings.
7. **Link targets the spec leaves out (D21).** "GitHub" (§5) goes to
   `https://github.com/Semantius`, and "Build an app" (§7) to the Free sign-up.
   The §6 examples link to the prompt pages: purchase approvals, equipment
   register, field service jobs and the agency tracker. The CRM page's six
   prompt cards take the §8 headings as their titles. "Install the skill" is
   now set by change request 1 (§10.1).
8. **The hero inverts the site theme (D22).** "Dark canvas" is built as dark on
   the light theme and light on the dark theme. The v0 "Preview" label above
   the hero is removed.

## My Choices, With Reasons

9. **No longer a choice:** change request 1 sends "Start free" and "Sign up" to
   `https://app.semantius.com/auth/sign-up` (§2, §9).
10. **The docs links that resolve.** "Rules and validation" goes to
    `/docs/business-logic`, which covers validation rules. "The CLI" goes to
    `/docs/cli`, "self-hosting" (§4.6, §7) to `/docs/self-hosted`, and "the
    agency sample prompt" (§6) to `/prompts/agency-client-tracker`. The others
    are TBD (`home-tbd.md`, A3).
11. **"Self-host with Dokploy" (§7) goes to `/docs/self-hosted/dokploy`.** It is
    the docs page on Dokploy, and D21 did not cover this button.
12. **No longer applies:** the hub's demo-prompt copy button is gone (change
    request 1, §1).
13. **Each prompt card's title links to its prompt page,** now on the CRM page
    (change request 1, §10.2). The link has no label of its own.
14. **No longer applies:** "Show the code" is gone (change request 1, §4 and
    §10.1).
15. **Note-form spec wording starts with a capital letter on the page,** and list
    items drop their closing semicolons. For example, §5.1's "only valid data
    under your rules;" renders as "Only valid data under your rules", and §5.3's
    "a refused change comes back..." as "A refused change comes back...". The
    bold-labeled points of the hub's specifications section are the exception:
    after the label, the text starts in lowercase, as change request 2 gives
    it.
16. **The hero is two columns on wide screens:** the text on the left, the
    graphic on the right. They stack on a phone. The sub-headline is one
    paragraph under the H1, and the agent line a smaller one below it. "Read
    the architecture manifesto" is outlined, of the "outline or ghost" choice.
17. **On a phone, the hero graphic's three layers stack under the node.** Only
    the line below the node remains; the bar and the lines down to each layer
    are hidden. The toggle is gone (change request 1, §2).
18. **"Build your CRM with your agent" shows "Copied" for a moment,** as the
    command boxes do. Without it, a visitor cannot tell the click worked.
19. **The hub keeps v0's `WebSite` structured data,** which the spec does not
    name. Its `SoftwareApplication` keeps v0's `operatingSystem` ("Web") and
    `applicationCategory` ("DeveloperApplication"), and states the license as
    `https://opensource.org/licenses/MIT`. The Free offer is the one /pricing
    publishes, from `data/pricing.ts`: name, price, currency, URL and the
    plan's summary, "For personal projects and small groups of up to 5 users."
    `SoftwareSourceCode` carries the name "Semantius" and the same license.
20. **The Agent guardrails `TechArticle` carries a headline (the H1) and
    Semantius as author and publisher.** The spec names the type only. It has no
    date, because the spec gives none.
21. **llms.txt opens with change request 1's paragraph (§11)** in place of the
    old product text in `llms-intro.md`, which named MCP servers, Neon and
    Supabase. The "Machine-readable formats" section and the generated index
    stay. Whether that is right is open (`home-tbd.md`, A5). The §10 sections
    are headed "Pages", "Specification", "Install", "Agents it works with" and
    "What Semantius is not". In "Pages", the hub is "Home", as in the
    breadcrumbs, the landing pages carry their reader labels (§11), and the
    prompt pages their headings. "Agents it works with" is the former hub FAQ's
    answer to "Which agent do I need?", word for word.
22. **All v0 hub sections are gone,** and so are the v1 sections change request
    1 removes (§1).
23. **Buttons the spec lists without a style:** the first is solid and the rest
    are outlined. This applies to the closing buttons of the three landing
    pages.
24. **No longer applies:** the footer says "Docs", as change request 1 gives it
    (§8).
25. **The install commands have Copy buttons,** on the six prompt pages, the only
    pages that still show them (`home-tbd.md`, B24). They are in the docs'
    command box, which always has one.
26. **No longer applies:** the hub has no FAQ (change request 1, §1).
27. **Bold lead-ins are H3 headings:** the CRM page's prompt card titles, the
    footer group titles, and "Guaranteed, where defined" and "Not guaranteed" on
    Agent guardrails, which also drop their closing colons. Change request 1
    makes the routing card questions H3 itself.
28. **llms.txt links each page to its markdown copy** (for example
    `/solutions/crm.md`), as every other link in that file does, where §10 says
    "each page's URL". "What Semantius is not" is three short sentences, one
    per item.
29. **The markdown copies open with a location line the site writes for every
    page:** "Solutions > ..." and "Prompts > ..." followed by the page's H1. It
    is not the Home > Page trail of item 6. It comes from the existing twin
    writer (`lib/dualmark/integration.ts`), which this build does not change.

## Change Request 1: My Choices, With Reasons

30. **Headings drop their closing period.** Change request 1 gives the new
    landing-page sections as bold sentences ending in a period. As headings
    they drop it, as the lead-ins of item 27 drop their colons. The sections
    ("The visual face of your agents", "No semantic drift", "No frontend tax")
    are H2 headings with a paragraph, like the sections around them.
31. **The routing cards** are two columns on wide screens and one on a phone.
    The reader label is a small line above the question. The link is a text
    link ending in an arrow, as §3 writes it, where the v1 cards had outlined
    buttons.
32. **The live demo's layout.** The two panes sit side by side from 1024 pixels
    wide and stack below. The request is a quoted chat bubble at the top of the
    left pane, under the pane title "Active data dictionary". The right pane's
    tabs are "The app", "The agent's attempt" and "The record". The tab list's
    name for screen readers, "What the definition produces", is not visible.
33. **The demo's TBD notes name no technology.** They are visible copy on the
    hub, above the specifications section, so the rule's note says "the one
    rule" rather than naming its language.
34. **Agent guardrails shows the hub's demo whole,** with its heading, caption
    and Start free button, in the place of the old "Demo" section.
35. **No longer applies:** the operational contracts list as built is gone
    (change request 2, §1).
36. **No longer applies:** the specifications items are H4 headings in one
    column (change request 2, §2).
37. **The CRM page's "Start from one of these"** sits directly above the two
    buttons, after the docs links and the cross-links, since §10.2 says "before
    the buttons".
38. **The search-term TBD on Agent guardrails** sits under the lead, since no
    sentence says where the term goes (`home-tbd.md`, B7).
39. **The header's Sign up is a link,** no longer the wait list's button. The
    wait list still opens from every "#signup" link: the announcement banner
    and the coming-soon plans on /pricing.
40. **The footer's article titles are plain text,** not italic as in the change
    request's list. While a post is unpublished, its title is followed by a TBD
    label.
41. **The landing pages' eyebrows use the hub's eyebrow style,** a small pill
    above the H1.

## Change Request 2: My Choices, With Reasons

42. **The comparison replaces the whole "The Directus difference" section on
    Agent guardrails,** heading and three items, since §3 checks for it "in place
    of 'The Directus difference'". It takes as its H2 the label it carried on
    the hub, "Compared with Directus, Supabase and Airtable". What the page lost
    is in `home-tbd.md`, D34.
43. **The specifications section is one column of text,** as wide as "Yours to
    keep". An item's points are a bulleted list with the label in bold, after
    the item's lead sentence and before its closing sentence where it has them.
    "These hold for every app, API and agent login:" is a paragraph above the
    guarantees.
44. **"Outside these contracts" follows item 15:** each item starts with a
    capital letter and drops its closing semicolon or period.
