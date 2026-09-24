# semantius-site

The source for the [semantius.com](https://semantius.com) website.

## Assets

Two asset collections are available for direct download:

- **Semantius Blueprints**: [`/blueprints`](./blueprints/)
- **Semantius Skills**: [`/skills`](./skills/)


## Docs

Docs content lives in [`apps/web/src/content/docs`](./apps/web/src/content/docs/). Every section is a folder with an `index.mdx`; there are no bare `.mdx` files at the top level.

The tab bar and sidebar are declared in [`nav.json`](./apps/web/src/content/docs/nav.json), not inferred from folder nesting:

- **A new page inside an existing folder** needs no change to `nav.json`. It appears automatically, positioned by its `order` frontmatter.
- **A new top-level folder** must be added to a tab's `folders` array, or it will not appear in any tab or sidebar. It still builds and stays reachable by direct link.

Reordering folders, or moving one between tabs, is a `nav.json` edit only and never changes a URL.

## Markdown Twins

Every page is published twice: as HTML for people and as markdown for AI agents. The markdown copy, called a twin, lives at the page URL plus `.md`, so `/about` has `/about.md` and `/` has `/index.md`. The code is adapted from [dualmark](https://github.com/dodopayments/dualmark) (Apache-2.0) and lives in [`apps/web/src/lib/dualmark`](./apps/web/src/lib/dualmark/). Keep its `NOTICE` and the "Adapted from dualmark" file headers, because the license requires them.

A twin comes from one of three sources, checked in this order:

| Tier | Pages | How the markdown is made | Written by |
| ---- | ----- | ------------------------ | ---------- |
| A | Content collections: docs, blog, blueprints, domains | Converted from the MDX or markdown source | [`[...twin].md.ts`](./apps/web/src/pages/[...twin].md.ts) and `manifest.ts` |
| B | Every other page, such as the home page, `/about` and `/features` | Extracted from the page's own built HTML | `markdownTwins()` in `integration.ts`, after the build |
| C | Any page with a hand-written file in `apps/web/src/data/twin-overrides/<path>.md` | Copied from that file as is | The same route as Tier A |

**A missing or broken twin never fails the build, and no page needs a hand-written twin.** A page without a Tier A or Tier C twin always falls back to Tier B. The build log reports how many twins came from each source.

**`/blueprints/source/<id>.md` is not a twin.** It is the original blueprint file, offered as a download, and its URL appears in a copyable command on each blueprint page. Changing its path or contents breaks commands people have already copied.

## Search

Site search uses [Pagefind](https://pagefind.app/), which builds a static index when the site is built. It indexes the HTML pages only and never reads the markdown twins, so the three tiers make no difference to search results.

Two things decide what gets indexed:

- **The `<main data-pagefind-body>` region** in `Layout.astro`. A page rendered with `searchable={false}` (listing pages) or `noindex` does not get this attribute and is left out of the index entirely.
- **The exclusion list** in `pagefindIndex()` in `apps/web/astro.config.mjs`: `aside`, `nav`, `.heading-anchor` and anything marked `data-pagefind-ignore`.

Tier B twins use the same two rules to decide what counts as content. Marking a decorative region `data-pagefind-ignore` therefore removes it from search and from the Tier B twins at once.

**The exclusion list exists twice**, in `astro.config.mjs` and again in `apps/web/src/lib/dualmark/source.ts`. Change both together, or search and the Tier B twins quietly drift apart.

`pnpm dev` does not build an index of its own. Run `pnpm build` once to get search results locally.

### Why the Index Reads HTML, Not MDX or Twins

Pagefind runs after the build and scans the output folder for `.html` files. It never sees the MDX source or the `.md` twins. It reads the visible text of the content region and splits it by heading, so a result can link straight to a section. Search therefore finds exactly what a reader sees, including text from components and remark plugins. Text the page never displays, such as frontmatter fields, cannot be found, and a change reaches search only after a rebuild.

**Indexing the twins as well would make search worse.** A Tier A twin repeats the text of its HTML page, plus agent boilerplate such as a breadcrumb and related links. Each page would appear twice in results, and one copy would open as raw markdown. The repeated boilerplate would also distort ranking. Indexing the twins instead of the HTML would lose the links to individual sections, so improve search by cleaning up the HTML index.

## Review

https://isitagentready.com/www.semantius.com