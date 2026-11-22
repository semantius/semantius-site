/**
 * Adapted from dualmark (Apache-2.0): packages/core/src/paths.ts
 * See ./NOTICE. Modified: holds every URL rule of the twins in one place,
 * including which pages have no twin, the absolute URL helpers and the check
 * for "a page, not a file".
 *
 * Every HTML page at `/foo` has a twin at `/foo.md`; the site root maps to
 * `/index.md`. Nothing outside this folder may build a twin URL by hand: call
 * these helpers, or the copies drift apart.
 */

/**
 * "about/" -> "/about", "" -> "/". Canonical URLs carry no trailing slash
 * (`trailingSlash: 'never'` in astro.config.mjs, `drop-trailing-slash` on the
 * Worker), but callers pass Astro pathnames and route-helper paths that may
 * carry one.
 */
export function normalizePagePath(pathname: string): string {
	const p = `/${pathname}`.replace(/\/{2,}/g, '/').replace(/\/+$/, '');
	return p === '' ? '/' : p;
}

/**
 * "/" -> "/index.md", "/a/b" -> "/a/b.md", "/a/b.md" -> "/a/b.md".
 * The trailing slash goes BEFORE the .md check, or "/a.md/" gets a doubled
 * extension.
 */
export function toMarkdownPath(pathname: string): string {
	const p = normalizePagePath(pathname);
	if (p === '/') return '/index.md';
	return p.endsWith('.md') ? p : `${p}.md`;
}

/** The inverse: "/index.md" -> "/", "/a/b.md" -> "/a/b". */
export function pagePathOfTwin(markdownPath: string): string {
	return markdownPath === '/index.md' ? '/' : markdownPath.replace(/\.md$/, '');
}

/**
 * Pages with no twin. Only /404 today: an error page, not content. Matched
 * against normalizePagePath(), so a trailing slash never reaches the pattern.
 *
 * Only structural exclusions belong here. The one other reason to add an entry
 * is a content hold: copy that must not become cleanly quotable yet (/pricing
 * sat here while it carried placeholder claims). Such an entry should say when
 * it comes off.
 */
const EXCLUDED = [/^\/404$/];

export function hasMarkdownTwin(pathname: string): boolean {
	return !EXCLUDED.some((re) => re.test(normalizePagePath(pathname)));
}

/** A site path that names a page, as opposed to a file such as /logo.png or /a.md. */
export function isPagePath(pathname: string): boolean {
	return pathname.startsWith('/') && !/\.[a-z0-9]{2,4}$/i.test(pathname);
}

/** Absolute URL of a page's twin. */
export function markdownUrl(pathname: string, site: URL | string | undefined): string {
	return new URL(toMarkdownPath(pathname), site).toString();
}

/**
 * Where a link to an internal page should point from inside a twin or from
 * llms.txt: the page's twin when it has one, so an agent following links stays
 * in markdown, and the HTML page (slash-less) otherwise.
 */
export function twinUrl(pathname: string, site: URL | string | undefined): string {
	return hasMarkdownTwin(pathname)
		? markdownUrl(pathname, site)
		: new URL(normalizePagePath(pathname), site).toString();
}

/**
 * The twin URL a page advertises, in its <link rel="alternate"> (SEO.astro) and
 * its "View as Markdown" row (PageActions.astro). Undefined for a page without
 * a twin and for a noindex page: the twin is still written for a noindex page,
 * but a page that asks not to be indexed must not point crawlers at a copy.
 */
export function advertisedTwinUrl(
	pathname: string,
	site: URL | string | undefined,
	noindex: boolean,
): string | undefined {
	return !noindex && hasMarkdownTwin(pathname) ? markdownUrl(pathname, site) : undefined;
}
