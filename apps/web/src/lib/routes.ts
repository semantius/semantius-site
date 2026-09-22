/**
 * The single source of truth for every content-derived URL on this site.
 *
 * Every .astro page, the markdown twin writers and rss.xml.js import from here.
 * The point is that the HTML route set and the twin route set cannot diverge:
 * if a slug rule changes, it changes in one place for both.
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
 * folder's index.mdx becomes the bare folder URL (models/index.mdx -> /models).
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

/* blueprints ----------------------------------------------------------- */

export function blueprintSlug(bp: CollectionEntry<'blueprints'>): string {
	return bp.data.system_slug;
}

/** The detail page: overview plus entity summary. */
export function blueprintPath(bp: CollectionEntry<'blueprints'>): string {
	return `/blueprints/${blueprintSlug(bp)}`;
}

/** The full-body page. 56 pages, easy to forget when enumerating routes. */
export function blueprintBodyPath(bp: CollectionEntry<'blueprints'>): string {
	return `/blueprints/${blueprintSlug(bp)}/blueprint`;
}

/**
 * The verbatim source download, keyed on the FILE id rather than the slug.
 * This is not a twin: no page exists at /blueprints/source/<file-id>. It is the
 * artifact users paste into an agent.
 *
 * The `source/` segment is load-bearing, not decoration. These files used to sit
 * at /blueprints/<file-id>.md, directly alongside the 68 real twins at
 * /blueprints/<slug>.md. public/_headers matches whole path segments, so no rule
 * could tell the two apart, and the twins could not be given a
 * rel="canonical" without pointing the 56 source files at a page that does not
 * exist. Moving them one level down makes both sets addressable.
 *
 * ALWAYS build source URLs from this function. Two pages used to interpolate the
 * old path by hand and would have broken silently on this move.
 */
export function blueprintSourcePath(bp: CollectionEntry<'blueprints'>): string {
	return `/blueprints/source/${bp.id}.md`;
}

export const BLUEPRINTS_INDEX_PATH = '/blueprints';

/* domains -------------------------------------------------------------- */

export function domainSlug(domain: CollectionEntry<'domains'>): string {
	return domain.data.code.toLowerCase();
}

/**
 * Domain landings share the /blueprints/[slug] route with blueprint details,
 * and the blueprint wins when the codes collide. Three of the 15 domain codes
 * collide today (hvac-svc-mgmt, it-ops-starter, real-estate-agent), so those
 * three domains have no landing page at all.
 */
export function domainHasLanding(
	domain: CollectionEntry<'domains'>,
	blueprintSlugs: Set<string>,
): boolean {
	return !blueprintSlugs.has(domainSlug(domain));
}

export function domainPath(domain: CollectionEntry<'domains'>): string {
	return `/blueprints/${domainSlug(domain)}`;
}

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
