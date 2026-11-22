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

Every page is published twice: as HTML for people and as markdown for AI agents. The markdown copy, called a twin, lives at the page URL plus `.md`, so `/about` has `/about.md` and `/` has `/index.md`.

Every twin is converted from its page's built HTML after the build, so a twin cannot say something its page does not. The only exception is a hand-written override, one file per page, added on purpose. All twin code lives in [`apps/web/src/lib/mdtwins`](./apps/web/src/lib/mdtwins/), and its [README](./apps/web/src/lib/mdtwins/README.md) explains how it works, what each file does and how to write an override.

**`/blueprints/source/<id>.md` is not a twin.** It is the original blueprint file, offered as a download, and its URL appears in a copyable command on each blueprint page. Changing its path or contents breaks commands people have already copied.

## Search

Site search uses [Pagefind](https://pagefind.app/), which builds a static index when the site is built. It indexes the HTML pages only and never reads the markdown twins.

Two things decide what gets indexed:

- **The `<main data-pagefind-body>` region** in `Layout.astro`. A page rendered with `searchable={false}` (listing pages) or `noindex` does not get this attribute and is left out of the index entirely.
- **The exclusion list**, `NON_CONTENT` in `apps/web/src/lib/mdtwins/extract.ts`: `aside`, `nav`, `.heading-anchor` and anything marked `data-pagefind-ignore`. `pagefindIndex()` in `apps/web/astro.config.mjs` takes it from there.

The markdown twins use the same `<main>` region and the same list to decide what counts as content. Marking a decorative region `data-pagefind-ignore` therefore removes it from search and from the twin at once.

`pnpm dev` does not build an index of its own. Run `pnpm build` once to get search results locally.

### Why the Index Reads HTML, Not MDX or Twins

Pagefind runs after the build and scans the output folder for `.html` files. It never sees the MDX source or the `.md` twins. It reads the visible text of the content region and splits it by heading, so a result can link straight to a section. Search therefore finds exactly what a reader sees, including text from components and remark plugins. Text the page never displays, such as frontmatter fields, cannot be found, and a change reaches search only after a rebuild.

**Indexing the twins as well would make search worse.** A twin repeats the text of its HTML page, plus agent boilerplate such as a breadcrumb and related links. Each page would appear twice in results, and one copy would open as raw markdown. The repeated boilerplate would also distort ranking. Indexing the twins instead of the HTML would lose the links to individual sections, so improve search by cleaning up the HTML index.

## Review

https://isitagentready.com/www.semantius.com