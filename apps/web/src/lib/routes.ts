/**
 * The single source of truth for every content-derived URL on this site.
 *
 * Every .astro page, llms.txt and rss.xml.js import from here, so a slug rule
 * changes in one place for all of them.
 *
 * This is not hypothetical. Before this module existed, rss.xml.js derived blog
 * links from `post.slug`, which the Astro content layer stopped providing, so
 * every item in the live feed linked to /blog/undefined. Deriving the same URL
 * in two places is how that happens.
 */
import type { CollectionEntry } from 'astro:content';

/** Strip the file extension from a content-layer id. */
function stripExt(id: string): string {
	return id.replace(/\.[^/.]+$/, '');
}

/* blog ---------------------------------------------------------------- */

export function blogSlug(post: CollectionEntry<'blog'>): string {
	return stripExt(post.id);
}

export function blogPath(post: CollectionEntry<'blog'>): string {
	return `/blog/${blogSlug(post)}`;
}

export const BLOG_INDEX_PATH = '/blog';

/* docs ---------------------------------------------------------------- */

/**
 * Routes mirror the on-disk folder structure under content/docs, and a
 * folder's index.mdx becomes the bare folder URL (cli/index.mdx -> /cli).
 * That second step is the non-obvious one and is why this is shared.
 */
export function docsSlug(doc: CollectionEntry<'docs'>): string {
	return stripExt(doc.id).replace(/(^|\/)index$/, '');
}

export function docsPath(doc: CollectionEntry<'docs'>): string {
	const slug = docsSlug(doc);
	return slug ? `/docs/${slug}` : '/docs';
}

export const DOCS_INDEX_PATH = '/docs';

/* skills --------------------------------------------------------------- */

export function skillSlug(catalog: CollectionEntry<'catalogs'>): string {
	return (catalog.data.domain_code_lower ?? catalog.data.domain_code).toLowerCase();
}

export function skillPath(catalog: CollectionEntry<'catalogs'>): string {
	return `/skills/${skillSlug(catalog)}`;
}

export const SKILLS_INDEX_PATH = '/skills';

/* changelog ------------------------------------------------------------ */

export const CHANGELOG_PATH = '/changelog';

/** Changelog entries are anchors on one page, not routes of their own. */
export function changelogAnchor(entry: CollectionEntry<'changelog'>): string {
	return `${CHANGELOG_PATH}#${entry.data.version.replace(/\./g, '-')}`;
}
