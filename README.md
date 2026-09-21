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

## Review

https://isitagentready.com/www.semantius.com