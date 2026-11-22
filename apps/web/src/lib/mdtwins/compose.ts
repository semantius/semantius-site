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
import { joinLines, normalizeUnicode } from './text';
import { htmlToMarkdown, pageFacts } from './extract';
import { canonicalUrl, twinUrl } from './paths';

export interface DocMeta {
	title: string;
	description?: string;
	/** Canonical HTML URL of the page this twin mirrors. Absolute. */
	url: string;
	/**
	 * Breadcrumb trail, outermost first, ENDING with the page itself. A trail
	 * that stops at the parent renders as a single generic crumb on any two-level
	 * page ("Docs"), which says strictly less than the `- **URL**:` line below it.
	 */
	trail: string[];
	/** Absolute URL of the site-wide agent index. */
	indexUrl: string;
}

export interface RelatedLink {
	title: string;
	/** Absolute URL, pointing at the .md twin so agents stay in markdown. */
	href: string;
}

/**
 * Header block. The breadcrumb and index lines are a blockquote so they read
 * as context rather than content, which is the shape Neon uses and which
 * agents appear to tolerate well.
 */
export function docHeader(meta: DocMeta): string {
	// Two crumbs minimum: with one, the only crumb IS the page, so the line
	// would name the page it heads and nothing else.
	const location =
		meta.trail.length > 1 ? `> This page location: ${meta.trail.join(' > ')}` : undefined;
	return normalizeUnicode(
		joinLines(
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
			`- **URL**: ${meta.url}`,
			'',
			'---',
			'',
			'',
		),
	);
}

/** Footer. Without related links it is the index link alone, never an empty "Related" heading. */
export function docFooter(related: RelatedLink[], indexUrl: string): string {
	if (related.length === 0) {
		return normalizeUnicode(`\n\n---\n\n- [Full index for agents](${indexUrl})\n`);
	}
	return normalizeUnicode(
		joinLines(
			'',
			'',
			'---',
			'',
			'## Related',
			'',
			...related.map((r) => `- [${r.title}](${r.href})`),
			`- [Full index for agents](${indexUrl})`,
			'',
		),
	);
}

/**
 * The page's own <h1>, lifted out of the body so the twin does not carry two
 * top-level titles, and preferred as the title: the visible heading ("Product
 * Updates") says more than the <title> tag ("Changelog"), which exists for
 * browser tabs and search results.
 *
 * ATX (# Title) and setext (Title over ===): remark-stringify falls back to
 * setext when a heading contains a hard break, as the home page's does. A
 * setext heading spans EVERY line above its underline, so the whole run is
 * taken, or the home twin loses the first half of its title.
 */
function liftLeadingH1(body: string): { heading?: string; rest: string } {
	const match = body.match(/^#\s+(.+?)\s*$/m) ?? body.match(/^((?:.+\r?\n)+?)=+\s*$/m);
	if (!match || body.indexOf(match[0]) >= 200) return { rest: body };
	return {
		// Hard breaks inside it are a trailing backslash per line.
		heading: match[1].replace(/\\?\r?\n/g, ' ').replace(/\s+/g, ' ').trim(),
		rest: body.replace(match[0], '').replace(/^\s+/, ''),
	};
}

/**
 * A page's complete twin, made from its built HTML. The only way a twin is
 * produced, apart from a hand-written override (see README.md).
 */
export function twinFromHtml(html: string, pagePath: string, siteUrl: string): string {
	const indexUrl = new URL('/llms.txt', siteUrl).toString();
	const facts = pageFacts(html);
	const { heading, rest } = liftLeadingH1(htmlToMarkdown(html, siteUrl));
	const title = heading ?? facts.title ?? pagePath;
	// The page's own breadcrumb, with its last crumb (the page itself) replaced
	// by the visible heading, which is what the reader sees as the page's name.
	const trail = facts.trail.length ? [...facts.trail.slice(0, -1), title] : [];
	return (
		docHeader({
			title,
			description: facts.description,
			url: canonicalUrl(pagePath, siteUrl),
			trail,
			indexUrl,
		}) +
		rest +
		docFooter(
			facts.related.map((r) => ({ title: r.title, href: twinUrl(r.path, siteUrl) })),
			indexUrl,
		)
	);
}
