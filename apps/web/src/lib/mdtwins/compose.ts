/**
 * Adapted from dualmark (Apache-2.0): packages/core/src/composition.ts
 * See ./NOTICE. Modified: docHeader/docFooter replace the per-archetype
 * converters, the platform footer is ours, and twinFromHtml() assembles every
 * twin from its page's HTML.
 *
 * The document shape every twin has:
 *
 *   > This page location: Docs > Data Catalog > Entities and Fields > Fields
 *   > Full index for agents: https://www.semantius.com/llms.txt
 *
 *   # Title
 *   > Description
 *
 *   - **URL**: https://www.semantius.com/docs/entities-and-fields/fields
 *
 *   ---
 *
 *   ...body...
 *
 *   ---
 *
 *   ## Related
 *   - [Formats](https://www.semantius.com/docs/entities-and-fields/formats.md)
 *   - [Full index for agents](https://www.semantius.com/llms.txt)
 */
import { joinLines } from './text';
import { htmlToMarkdown, pageFacts } from './extract';
import { twinUrl } from './paths';

interface DocMeta {
	title: string;
	description?: string;
	/** The page's canonical URL, as its <link rel="canonical"> publishes it. */
	url?: string;
	/**
	 * Breadcrumb trail, outermost first, ENDING with the page itself. A trail
	 * that stops at the parent renders as a single generic crumb on any two-level
	 * page ("Docs"), which says strictly less than the `- **URL**:` line below it.
	 */
	trail: string[];
	/** Absolute URL of the site-wide agent index. */
	indexUrl: string;
}

interface RelatedLink {
	title: string;
	/** Absolute URL, pointing at the .md twin so agents stay in markdown. */
	href: string;
}

/**
 * Header block. The breadcrumb and index lines are a blockquote so they read
 * as context rather than content, which is the shape Neon uses and which
 * agents appear to tolerate well.
 */
function docHeader(meta: DocMeta): string {
	// Two crumbs minimum: with one, the only crumb IS the page, so the line
	// would name the page it heads and nothing else.
	const location =
		meta.trail.length > 1 ? `> This page location: ${meta.trail.join(' > ')}` : undefined;
	return joinLines(
		location,
		`> Full index for agents: ${meta.indexUrl}`,
		'',
		`# ${meta.title}`,
		'',
		// Prefix every line: a description that spans paragraphs would
		// otherwise leave the rest dangling as body text above the URL line.
		meta.description &&
			meta.description
				.trim()
				.split('\n')
				.map((l) => (l.trim() ? `> ${l.trim()}` : '>'))
				.join('\n'),
		meta.description && '',
		meta.url && `- **URL**: ${meta.url}`,
		'',
		'---',
		'',
		'',
	);
}

/** Footer. Without related links it is the index link alone, never an empty "Related" heading. */
function docFooter(related: RelatedLink[], indexUrl: string): string {
	if (related.length === 0) {
		return `\n\n---\n\n- [Full index for agents](${indexUrl})\n`;
	}
	return joinLines(
		'',
		'',
		'---',
		'',
		'## Related',
		'',
		...related.map((r) => `- [${r.title}](${r.href})`),
		`- [Full index for agents](${indexUrl})`,
		'',
	);
}

export interface Twin {
	markdown: string;
	/** The twin's title, as its "# " line says it. */
	title: string;
	/** The page asks not to be indexed, so the twin is not listed in llms-full.txt. */
	noindex: boolean;
}

/**
 * A page's complete twin, made from its built HTML. The only way a twin is
 * produced, apart from a hand-written override (see README.md).
 *
 * The title is the page's visible <h1> (extract.ts takes it out of the body),
 * falling back to <title>: the heading ("Product Updates") says more than the
 * tag ("Changelog"), which exists for browser tabs and search results. The
 * breadcrumb, URL and description are exactly what the page publishes.
 */
export function twinFromHtml(html: string, pagePath: string, siteUrl: string): Twin {
	const indexUrl = new URL('/llms.txt', siteUrl).toString();
	const facts = pageFacts(html);
	const title = facts.heading ?? facts.title ?? pagePath;
	const markdown =
		docHeader({
			title,
			description: facts.description,
			url: facts.canonical,
			trail: facts.trail,
			indexUrl,
		}) +
		htmlToMarkdown(html, siteUrl) +
		docFooter(
			facts.related.map((r) => ({ title: r.title, href: twinUrl(r.path, siteUrl) })),
			indexUrl,
		);
	return { markdown, title, noindex: facts.noindex };
}
