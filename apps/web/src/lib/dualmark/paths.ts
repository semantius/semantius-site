/**
 * Adapted from dualmark (Apache-2.0): packages/core/src/paths.ts
 * See ./NOTICE. Modified: added toHtmlPath and isMarkdownPath.
 *
 * URL path helpers for the markdown twin convention. Every HTML page at
 * `/foo` has a twin at `/foo.md`; the site root maps to `/index.md`.
 *
 * Canonical URLs carry no trailing slash (`trailingSlash: 'never'`), so the
 * strip below is defensive rather than load-bearing: callers pass route-helper
 * paths and raw pathnames, and a slashed one must not produce `/foo/.md`.
 */

/**
 * "/"          -> "/index.md"
 * "/blog/"     -> "/blog.md"
 * "/a/b"       -> "/a/b.md"
 * "/a/b.md"    -> "/a/b.md"   (idempotent)
 */
export function toMarkdownPath(pathname: string): string {
	// Strip trailing slashes BEFORE the .md check, or a twin path that arrives
	// with a trailing slash defeats the guard and gets a doubled extension.
	const trimmed = pathname.replace(/\/+$/, '');
	if (trimmed === '') return '/index.md';
	if (trimmed.endsWith('.md')) return trimmed;
	return `${trimmed}.md`;
}

/** Inverse of toMarkdownPath, used by the coverage report. */
export function toHtmlPath(pathname: string): string {
	if (!pathname.endsWith('.md')) return pathname;
	const stripped = pathname.slice(0, -3);
	return stripped === '/index' ? '/' : stripped;
}

export function isMarkdownPath(pathname: string): boolean {
	return pathname.replace(/\/+$/, '').endsWith('.md');
}

/** Absolute twin URL for a page path. Preserves nothing else; twins take no query. */
export function toMarkdownUrl(pathname: string, site: URL | string): string {
	return new URL(toMarkdownPath(pathname), site).toString();
}

/**
 * Reserved origin used while converting content in a context that cannot know
 * the real site URL.
 *
 * The content loaders run after Vite has merged `apps/web/.env` into
 * `process.env`, where SITE_URL is the dev server address, so reading it there
 * bakes http://localhost:4321 into production output. `.invalid` is reserved by
 * RFC 2606 and can never appear in real content, so the twin writers can swap
 * it for Astro's resolved `site` with a plain string replace, without
 * re-parsing a document that may contain mermaid fences.
 */
export const SITE_PLACEHOLDER = 'https://site.invalid';

/** Swap the placeholder origin for the real one. */
export function resolveSite(markdown: string, siteUrl: string): string {
	const origin = siteUrl.replace(/\/+$/, '');
	return markdown.split(SITE_PLACEHOLDER).join(origin);
}
