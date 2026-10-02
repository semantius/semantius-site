# Semantius

> TBD: one paragraph on what Semantius is (founder's v1 spec, section 10). Not written yet.

## Machine-readable formats

Almost every page on this site is also published as markdown, at the same path
with ".md" appended:

    https://www.semantius.com/docs/cli        ->  https://www.semantius.com/docs/cli.md
    https://www.semantius.com/about           ->  https://www.semantius.com/about.md
    https://www.semantius.com/                ->  https://www.semantius.com/index.md

Rather than guessing a URL, follow the links below or read the page's own
`<link rel="alternate" type="text/markdown">`: both only ever name twins that
exist.

Each HTML page advertises its own twin with
`<link rel="alternate" type="text/markdown" href="...">`. Every link below
points at the markdown form, so you can follow them without leaving markdown.

An index of the documentation, blog and blueprint twins is at
https://www.semantius.com/llms-full.txt

Blueprints additionally publish their complete source specification, YAML
frontmatter included, at https://www.semantius.com/blueprints/source/<file-id>.md
