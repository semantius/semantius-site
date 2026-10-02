# Home Page v1.3: Deviations From the Spec

Every place where the build on branch `home-v1.3` departs from the founder's v1
specification as amended by change requests 1 to 3, or decides something they
leave unsaid, with the reason for each. Open questions are in `home-tbd.md`, not here.

Items keep their numbers so references stay valid. An item that a change
request made moot says so in one line.

## Decided by You

1. **Section names are visible H2 headings (D15).** The change requests name
   every heading on the hub and on the three solution pages. Agent guardrails
   keeps "Deterministic checks, bounded outcomes" and "Specification", now as
   H3 headings in part 1 (change request 3, §3.1). Docs links, cross-links and
   buttons stay unlabeled.
2. **The header gets a Solutions menu (D16).** It lists the three solution pages
   under their reader labels (change request 3, §2.2), with no descriptions or
   icons. The Product menu (Features, Pricing) is unchanged. Resources is
   trimmed to Docs, Blog and Changelog as §9 says.
3. **The footer is on every page (D17).** It adds Privacy and Terms links,
   which no page linked before, and keeps the theme toggle (the site's only
   theme switch) and the GitHub icon. The bottom line is "© Semantius by
   adenin." as specified.
4. **The announcement banner stays on every page (D18),** as change request 1
   (§9) confirms.
5. **Each solution page links the other two and /pricing (D19),** with the hub
   cards' link labels from change request 3 (§2.1), without the arrow ("See how
   guardrails work", "See the back end", "See business apps"), and "See
   pricing". Change request 3 calls them "Related pages" and puts them last.
6. **Breadcrumbs are Home > Page, in the JSON-LD only (D20).** No /solutions or
   /prompts page exists to sit in between. Solution pages use their names in
   the site map of change request 3 (§1): "Agent guardrails", "Back end" and
   "Business apps", not the reader labels; prompt pages use their headings.
7. **Link targets the spec leaves out (D21).** "GitHub" goes to
   `https://github.com/Semantius`. The prompt cards take the §8 headings as
   their titles. "Install the skill" is set by change request 1 (§10.1).
8. **The hero inverts the site theme (D22).** "Dark canvas" is built as dark on
   the light theme and light on the dark theme. The v0 "Preview" label above
   the hero is removed.

## Change Request 3: Decided by You

45. **A docs link with no page keeps its label and a TBD,** against change
    request 3's "no empty placeholders": row-level security (Agent guardrails),
    customizing the app and module export (Back end), importing data and
    approval steps (Business apps) (`home-tbd.md`, A3).
46. **Every TBD already built stays:** the prompt pages' "what the result
    includes", the /about label and the TBD text in llms.txt. Change request 3's
    rules (lines 18 to 20, and §8) would have removed them, which contradicts
    change request 1's "mark every gap with a visible TBD".
47. **The prompt pages keep their install steps,** although change request 3
    describes them as "without install commands".
48. **Business apps §5.5 is built word for word.** "CSV files" and "incoming
    webhooks" are not technology names in the sense of the plain-word rule, and
    Airtable, monday, SmartSuite and Power Apps are tools the reader outgrew,
    not a comparison.

## My Choices, With Reasons

9. **No longer a choice:** change request 1 sends "Start free" and "Sign up" to
   `https://app.semantius.com/auth/sign-up` (§2, §9).
10. **The docs links that resolve.** "Rules and validation" goes to
    `/docs/business-logic`, which covers validation rules. "The CLI" goes to
    `/docs/cli`, and "self-hosting" to `/docs/self-hosted`. The others are TBD
    (`home-tbd.md`, A3).
11. **"Self-host with Dokploy" goes to `/docs/self-hosted/dokploy`,** now on Back
    end (change request 3, §4.4). It is the docs page on Dokploy.
12. **No longer applies:** the hub's demo-prompt copy button is gone (change
    request 1, §1).
13. **Each prompt card's title links to its prompt page,** on Agent guardrails
    and Business apps (change request 3, §3.2 and §5.2). The link has no label
    of its own.
14. **No longer applies:** "Show the code" is gone (change request 1, §4 and
    §10.1).
15. **Note-form spec wording starts with a capital letter on the page,** and list
    items drop their closing semicolons. For example, §5.1's "only valid data
    under your rules;" renders as "Only valid data under your rules", and the
    "For IT" bullets on Agent guardrails start with a capital letter. The
    bold-labeled points are the exception: after the label, the text starts as
    the change request gives it, on the hub's specifications section, Back end
    and Business apps.
16. **The hero is two columns on wide screens:** the text on the left, the
    graphic on the right. They stack on a phone. The sub-headline is one
    paragraph under the H1, and the agent line a smaller one below it. "Read
    the architecture manifesto" is outlined, of the "outline or ghost" choice.
17. **On a phone, the hero graphic's three layers stack under the node.** Only
    the line below the node remains; the bar and the lines down to each layer
    are hidden. The toggle is gone (change request 1, §2).
18. **No longer applies:** "Build your CRM with your agent" left with the CRM page
    (change request 3, §6).
19. **The hub keeps v0's `WebSite` structured data,** which the spec does not
    name. Its `SoftwareApplication` keeps v0's `operatingSystem` ("Web") and
    `applicationCategory` ("DeveloperApplication"), and states the license as
    `https://opensource.org/licenses/MIT`. The Free offer is the one /pricing
    publishes, from `data/pricing.ts`: name, price, currency, URL and the
    plan's summary, "For personal projects and small groups of up to 5 users."
    `SoftwareSourceCode` carries the name "Semantius" and the same license.
20. **The Agent guardrails `TechArticle` carries a headline (the H1) and
    Semantius as author and publisher.** The spec names the type only. It has no
    date, because the spec gives none. The two new pages carry only their
    `BreadcrumbList` (change request 3, §7).
21. **llms.txt opens with change request 1's paragraph (§11)** in place of the
    old product text in `llms-intro.md`, which named MCP servers, Neon and
    Supabase. The "Machine-readable formats" section and the generated index
    stay. Whether that is right is open (`home-tbd.md`, A5). The §10 sections
    are headed "Pages", "Specification", "Install", "Agents it works with" and
    "What Semantius is not". In "Pages", the hub is "Home", as in the
    breadcrumbs, the solution pages carry their reader labels and the summaries
    of change request 3 (§7), and the prompt pages their headings. "Agents it
    works with" is the former hub FAQ's answer to "Which agent do I need?", word
    for word.
22. **All v0 hub sections are gone,** and so are the v1 sections change request
    1 removes (§1).
23. **Buttons the spec lists without a style:** the first is solid and the rest
    are outlined. This applies to the closing buttons of the three solution
    pages.
24. **No longer applies:** the footer says "Docs", as change request 1 gives it
    (§8).
25. **The install commands have Copy buttons,** on the six prompt pages, the only
    pages that still show them (item 47). They are in the docs' command box,
    which always has one.
26. **No longer applies:** the hub has no FAQ (change request 1, §1).
27. **Bold lead-ins are headings one level below their section:** the prompt
    card titles (H4 on Agent guardrails, H3 on Business apps), the footer group
    titles, and "Guaranteed, where defined" and "Not guaranteed" on Agent
    guardrails (now H4), which also drop their closing colons.
28. **llms.txt links each page to its markdown copy** (for example
    `/solutions/backend.md`), as every other link in that file does, where §10
    says "each page's URL". "What Semantius is not" is three short sentences,
    one per item.
29. **The markdown copies open with a location line the site writes for every
    page:** "Solutions > ..." and "Prompts > ..." followed by the page's H1. It
    is not the Home > Page trail of item 6. It comes from the existing twin
    writer (`lib/dualmark/integration.ts`), which this build does not change.

## Change Request 1: My Choices, With Reasons

30. **Headings drop their closing period or colon** where a change request gives
    a section as a bold sentence or label: "The visual face of your agents",
    "For IT", "Deterministic checks, bounded outcomes". The eight challenge
    headings of change request 3 keep their period, since §3.1 says "the
    heading as given".
31. **The routing cards** are three columns on wide screens and one on a phone
    (change request 3, §2.1). The reader label is a small line above the
    question. The link is a text link ending in an arrow.
32. **The live demo's layout.** The two panes sit side by side from 1024 pixels
    wide and stack below. The request is a quoted chat bubble at the top of the
    left pane, under the pane title "Active data dictionary". The right pane's
    tabs are "The app", "The agent's attempt" and "The record". The tab list's
    name for screen readers, "What the definition produces", is not visible.
33. **The demo's TBD notes name no technology.** They are visible copy on the
    hub, above the specifications section, so the rule's note says "the one
    rule" rather than naming its language.
34. **Agent guardrails shows the hub's demo whole,** with its heading as an H3
    (change request 3, §3.1), caption and Start free button, in part 1 between
    "The visual face of your agents" and "Specification".
35. **No longer applies:** the operational contracts list as built is gone
    (change request 2, §1).
36. **No longer applies:** the specifications items are H4 headings in one
    column (change request 2, §2).
37. **No longer applies:** the CRM page is gone (change request 3, §1).
38. **No longer applies:** the search-term TBD on Agent guardrails gave way to
    the specification line (change request 3, §3.1).
39. **The header's Sign up is a link,** no longer the wait list's button. The
    wait list still opens from every "#signup" link: the announcement banner,
    "Notify me" on Business apps, and the coming-soon plans on /pricing.
40. **The footer's article titles are plain text,** not italic as in the change
    request's list. While a post is unpublished, its title is followed by a TBD
    label.
41. **The solution pages' eyebrows use the hub's eyebrow style,** a small pill
    above the H1.

## Change Request 2: My Choices, With Reasons

42. **No longer applies:** the comparison left Agent guardrails (change request
    3, §3.1).
43. **The specifications section is one column of text,** as wide as "Yours to
    keep". An item's points are a bulleted list with the label in bold, after
    the item's lead sentence and before its closing sentence where it has them.
    "These hold for every app, API and agent login:" is a paragraph above the
    guarantees.
44. **"Outside these contracts" follows item 15:** each item starts with a
    capital letter and drops its closing semicolon or period.

## Change Request 3: My Choices, With Reasons

49. **The two jump links under the Agent guardrails lead** are text links side by
    side on wide screens, stacked on a phone.
50. **"Specification" keeps its own section** after the live demo, so the anchor
    `#specification` that Back end's "Read the specification" links to lands on
    its heading.
51. **The Back end lead is three paragraphs,** one per item of §4's list.
52. **"Not generated code, a model." is a bold lead-in** at the start of its
    paragraph in "Day 30, not day 1", as §4.1 writes it.
53. **The prompt cards are one row of three** on wide screens, with the intro
    line above them in italics, as given, and the cross-link below them ending in
    an arrow.
54. **"Notify me" and "See pricing" follow the plans list on Business apps** as
    two links, as on the hub before change request 2.
55. **The connection table keeps its rows as built,** each starting with a
    capital letter (item 15), where §5.1 shows them in lowercase.
56. **The end of each solution page** is docs links, then buttons, then the
    related pages, in the order change request 3 lists them.
