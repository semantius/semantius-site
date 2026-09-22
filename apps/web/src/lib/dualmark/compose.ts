/**
 * Adapted from dualmark (Apache-2.0): packages/core/src/composition.ts
 * See ./NOTICE. Modified: docHeader/docFooter replace the per-archetype
 * converters, and the platform footer is ours.
 *
 * The shared document shape every twin uses, whichever tier produced it:
 *
 *   > This page location: Docs > Reference > CLI
 *   > Full index: https://www.semantius.com/llms.txt
 *
 *   # Title
 *   > Description
 *
 *   - **Updated**: 2026-09-22
 *   - **URL**: https://www.semantius.com/docs/cli/
 *
 *   ---
 *
 *   ...body...
 *
 *   ---
 *   ## Related
 *   - [Thing](https://www.semantius.com/docs/thing.md)
 */
import { joinLines, normalizeUnicode } from './text';

export interface DocMeta {
	title: string;
	description?: string;
	/** Canonical HTML URL of the page this twin mirrors. Absolute. */
	url: string;
	/** Breadcrumb trail, outermost first, excluding the page itself. */
	trail?: string[];
	/** Absolute URL of the site-wide agent index. */
	indexUrl: string;
	/** Extra metadata bullets, rendered in order after the date. */
	facts?: Array<[label: string, value: string | undefined]>;
	updated?: string;
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
	const location = meta.trail?.length
		? `> This page location: ${meta.trail.join(' > ')}`
		: undefined;
	const facts = (meta.facts ?? []).filter((f): f is [string, string] => Boolean(f[1]));
	return normalizeUnicode(
		joinLines(
			location,
			`> Full index for agents: ${meta.indexUrl}`,
			'',
			`# ${meta.title}`,
			'',
			// Prefix every line: some descriptions (blueprint system_description)
			// span paragraphs, and quoting only the first line leaves the rest
			// dangling as body text above the metadata block.
			meta.description &&
				meta.description
					.trim()
					.split('\n')
					.map((l) => (l.trim() ? `> ${l.trim()}` : '>'))
					.join('\n'),
			meta.description && '',
			meta.updated && `- **Updated**: ${meta.updated}`,
			...facts.map(([label, value]) => `- **${label}**: ${value}`),
			`- **URL**: ${meta.url}`,
			'',
			'---',
			'',
			'',
		),
	);
}

/**
 * Footer. Omitted entirely when there is no real relationship data, rather
 * than emitting an empty "Related" heading.
 */
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

export interface ListingItem {
	title: string;
	/** Absolute .md URL. */
	href: string;
	description?: string;
}

/** Body for an index page twin: a flat or grouped bullet list of links. */
export function listingBody(
	items: ListingItem[],
	groupBy?: (item: ListingItem) => string,
): string {
	const line = (i: ListingItem) =>
		i.description ? `- [${i.title}](${i.href}): ${i.description}` : `- [${i.title}](${i.href})`;

	if (!groupBy) return normalizeUnicode(items.map(line).join('\n'));

	const groups = new Map<string, ListingItem[]>();
	for (const item of items) {
		const key = groupBy(item);
		const existing = groups.get(key);
		if (existing) existing.push(item);
		else groups.set(key, [item]);
	}
	const out: string[] = [];
	for (const [name, groupItems] of groups) {
		out.push(`## ${name}`, '', ...groupItems.map(line), '');
	}
	return normalizeUnicode(out.join('\n').trim());
}
