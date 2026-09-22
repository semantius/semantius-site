/**
 * Navigation context for twins: the breadcrumb header and related-links footer.
 *
 * A twin is read in isolation, often as one retrieved chunk with no memory of
 * where it came from. Without this an agent cannot tell what section a page
 * belongs to or what to read next. Neon's docs use the same pattern.
 *
 * Every tier calls this, not just the source-converted ones, so the output
 * shape is identical whichever writer produced a twin. Where there is no real
 * relationship data the footer degrades to the index link alone rather than
 * inventing relationships.
 */
import { toMarkdownPath } from './paths';
import { hasMarkdownTwin } from './excluded';
import { slugToTitle } from './text';
import type { RelatedLink } from './compose';

/** Absolute .md URL for an internal page path, for use in related links. */
export function twinUrl(pathname: string, siteUrl: string): string {
	const target = hasMarkdownTwin(pathname) ? toMarkdownPath(pathname) : pathname;
	return new URL(target, siteUrl).toString();
}

export function canonicalUrl(pathname: string, siteUrl: string): string {
	// Canonical HTML URLs carry NO trailing slash: astro.config.mjs sets
	// trailingSlash:'never' and the Worker's html_handling is
	// drop-trailing-slash, so the slashed form 307s away. Strip rather than
	// pass through, because callers pass route-helper paths that may not agree.
	const p = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');
	return new URL(p, siteUrl).toString();
}

/**
 * Fallback breadcrumb derived from the URL path, used for pages with no
 * navigation tree of their own (the flat marketing pages). Real trees, docs
 * and blueprints, pass an explicit trail instead.
 */
export function trailFromPath(pathname: string): string[] {
	const parts = pathname.split('/').filter(Boolean);
	if (parts.length === 0) return [];
	return parts.map(slugToTitle);
}

export function relatedLink(title: string, pathname: string, siteUrl: string): RelatedLink {
	return { title, href: twinUrl(pathname, siteUrl) };
}
