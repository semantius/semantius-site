import { hasMarkdownTwin, isPagePath, toMarkdownPath } from './paths';

export interface PageRedirect {
	status: 301 | 302;
	destination: string;
}

/**
 * Every page redirect, plus the redirect of its twin: "/old" -> "/new" also
 * gives "/old.md" -> "/new.md", with the same status. Without it, an agent that
 * was given an old URL and appends ".md" gets a 404, because Astro's redirects
 * only cover the HTML form.
 *
 * Derived rather than listed in src/data/redirects.jsonc, so the two forms can
 * never disagree about where an old path now lives. A target with no twin (a
 * file, an external URL, an excluded page) gets no twin redirect.
 */
export function withTwinRedirects(
	redirects: Record<string, PageRedirect>,
): Record<string, PageRedirect> {
	const out = { ...redirects };
	for (const [from, { status, destination }] of Object.entries(redirects)) {
		if (isPagePath(destination) && hasMarkdownTwin(destination)) {
			out[toMarkdownPath(from)] = { status, destination: toMarkdownPath(destination) };
		}
	}
	return out;
}
