# Markdown twins

Every page of the site is published twice: as HTML for people, and as markdown for AI agents. The markdown copy is the page's **twin**, at the page URL plus `.md`:

| Page | Twin |
| --- | --- |
| `/docs/cli` | `/docs/cli.md` |
| `/` | `/index.md` |

Everything that makes twins lives in this folder.

## The one rule: a twin is made from its page

Every twin is converted from the page's **built HTML**, after the build. Nothing here re-renders a page from its MDX source or from collection data, and no page text is written in this folder.

The HTML is the page. Whatever a template says, a component computes or a remark plugin adds is in it, so a twin made from it cannot say something the page does not. A twin produced any other way is a second rendering of the page, and a second rendering drifts: the page changes, its copy does not.

So when a twin is wrong, fix the page's markup or one of the generic rules in `extract.ts`. Never patch the twin text in code.

The one exception is a [hand-written override](#hand-written-overrides). It is explicit, per page and your decision.

## How a twin is made

After `astro build` has written every page, `integration.ts` takes each page in turn:

1. **Skip** it if `hasMarkdownTwin()` in `paths.ts` says it has no twin. Only `/404` is excluded today.
2. **Use the override** if `overrides/<page path>.md` exists, copied as is.
3. **Otherwise convert** the page's `index.html` with `twinFromHtml()` in `compose.ts`:
   - `pageFacts()` reads what the page publishes about itself (see [What the converter reads](#what-the-converter-reads-from-a-page)).
   - `htmlToMarkdown()` converts the content region, without its `<h1>`, to the body.
   - The shared header and footer go around it.
4. **Write** it next to the page, as `dist/client/<page path>.md`.

It then writes `llms-full.txt`, an index of every twin with its title (except those of noindex pages), and reports in the build log (see [Build log](#build-log)).

In `astro dev` there is no build output, so the same integration serves `/<page>.md` on request: it fetches the page from the dev server and runs the same `twinFromHtml()`. `llms-full.txt` exists only after a build.

## What each file does

| File | What it does |
| --- | --- |
| `integration.ts` | The Astro integration: writes every twin and `llms-full.txt` after the build, serves twins in `astro dev`, reports in the build log. Registered in `astro.config.mjs`. |
| `compose.ts` | `twinFromHtml()`, the complete twin for one page, and the shared header and footer layout. |
| `extract.ts` | The only converter: HTML to markdown, every generic rule, `pageFacts()`, and the `NON_CONTENT` list shared with site search. |
| `paths.ts` | Every URL rule: `/foo` to `/foo.md` and back, which pages have no twin, the absolute twin URL, the URL a page advertises. |
| `redirects.ts` | `withTwinRedirects()`: every redirect in `apps/web/redirects.jsonc` also redirects its twin (`/old.md` to `/new.md`, same status). |
| `text.ts` | Small text helpers for the header and footer. |
| `PageActions.astro` | The "View as Markdown, Copy as Markdown, Ask Claude, Ask ChatGPT" row under a docs page's title. Placed by `layouts/DocsLayout.astro`. |
| `overrides/` | Hand-written twins. Does not exist until the first one is written. |
| `NOTICE`, `LICENSE-APACHE-2.0.txt` | License attribution, see [License](#license). |

Code that exists only for the twins lives here. Outside this folder, these use what it exports and hold no twin logic of their own:

| File | Uses |
| --- | --- |
| `astro.config.mjs` | registers `markdownTwins()`, calls `withTwinRedirects()`, hands `nonContentSelectors()` to Pagefind |
| `layouts/DocsLayout.astro` | places `PageActions.astro` |
| `components/layout/SEO.astro` | `advertisedTwinUrl()` for `<link rel="alternate" type="text/markdown">` |
| `pages/llms.txt.ts` | `twinUrl()`, so every link in the index points at a twin |

## What counts as content

The body is the page's `<main>` element without:

- **`NON_CONTENT`** in `extract.ts`: `aside`, `nav`, `.heading-anchor` and anything marked `data-pagefind-ignore`. Site search (Pagefind) excludes exactly the same list, because `astro.config.mjs` takes it from here. Marking a region `data-pagefind-ignore` removes it from search and from the twin at once.
- **Elements that are never text**: `script`, `style`, `svg`, `button`, `form`, `iframe`, widget parts such as `select` and `input`, and anything `aria-hidden="true"`.

## What the converter reads from a page

No page carries markup for the twin's sake. The converter reads what the HTML already says:

| In the page | In the twin |
| --- | --- |
| the first `<h1>` in `<main>`, or `<title>` without the site name | title (the `<h1>` leaves the body) |
| `<meta name="description">` | description |
| `<link rel="canonical">` | the "URL" line |
| JSON-LD `BreadcrumbList` | "This page location", exactly as published. A page that passes no `breadcrumbs` to `Layout.astro` gets one built from URL slugs ("Hvac svc mgmt"), so give it real names on the page: that fixes search engines and the twin at once. |
| `<meta name="robots" content="noindex">` | the twin is still written, but not listed in `llms-full.txt` |
| `<a rel="prev">`, `<a rel="next">` | "Related" footer, labeled as the link reads ("Previous: Modules") |
| `<pre data-language="bash">` (Shiki, every fenced block) | code block in that language |
| `<pre class="mermaid">` | mermaid code block |
| `.command-text` (the command box of `Command.astro` and `SkillInstall.astro`) | `bash` code block, or `text` inside a chat box (`.command.is-chat`) |
| `data-pagefind-ignore` | left out, as it is from site search |

**Two class names are a contract.** `mermaid` cannot change without breaking the diagrams on the page. `command-text` is also used by `styles/components.css` and `SkillInstall.astro`'s script; whoever renames it must update `languageOf()` in `extract.ts`, or those twins lose their code fences.

## Generic rules

All in `extract.ts`. None of them names a page.

- **Code keeps its language.** Every code element `languageOf()` recognizes (see the table above) becomes a fenced block in that language.
- **Cards.** A link around a whole block (title, description, date) would become one long link label. When a link wraps block elements, or stands on its own and holds more than one text block, the link moves onto the card's heading (or its first text block) and the rest stays plain text. A link in running text is never treated as a card.
- **Links point at twins.** Internal links become absolute and point at the target's twin, so an agent following them stays in markdown. Files stay files. `href="#"` keeps its label and loses the link.
- **Row layouts.** Children of a `flex` or `grid` container get a space between them, because their visual gap was CSS only.
- **Empty icon links** are dropped.

## Hand-written overrides

Use an override only when a page's twin cannot be made right by fixing the page or a generic rule.

**To add one:**

1. Build once, then copy the generated twin as a starting point:
   `apps/web/dist/client/docs/cli.md` to `apps/web/src/lib/mdtwins/overrides/docs/cli.md`.
   The path under `overrides/` is the twin's path. The home page is `overrides/index.md`.
2. Edit it. The file is the **complete** twin, header and footer included, and is served byte for byte. Nothing is added to it.
3. Build. The log line `N markdown twins (X extracted, Y hand-written overrides)` counts it. `astro dev` serves it too.

**What you take on:** an override is a second copy of the page, so it no longer follows the page. When the page changes, update the override, or delete it to return to the generated twin. That is why there are none by default, and why each one should be a deliberate choice.

## Redirects

Redirects are listed in `apps/web/redirects.jsonc`. `withTwinRedirects()` gives each one a twin redirect with the same status, so `/old.md` follows `/old`. Never list the `.md` form in that file.

## Build log

| Line | Meaning |
| --- | --- |
| `N markdown twins (X extracted, Y hand-written overrides)` | every twin written in this build |
| `... twin(s) under 200 bytes` | extraction found almost nothing: fix the page, or consider an override |
| `... page(s) have no HTML to make a twin from` | a page the build listed has no `index.html` |
| `... contain the dev origin http://localhost:4321` | the dev `SITE_URL` reached a twin instead of the configured site |

None of these fails the build. The twins are the only `.md` files the site publishes, so nothing else can overwrite one.

## License

`compose.ts`, `paths.ts` and `text.ts` are adapted from [dualmark](https://github.com/dodopayments/dualmark) (Apache-2.0). Keep `NOTICE`, `LICENSE-APACHE-2.0.txt` and the "Adapted from dualmark" file headers: the license requires them. The other files are original work.
