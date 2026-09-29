/**
 * The single definition of "which pages get a markdown twin".
 *
 * Three consumers import this and must never disagree:
 *   1. the route writer (src/pages/[...twin].md.ts)
 *   2. the build-time writer and coverage report (astro.config.mjs)
 *   3. the <link rel="alternate"> in SEO.astro
 */

/**
 * Pages with no twin:
 *  - /404, which is an error page, not content. The regexes below tolerate a
 *    trailing slash because Astro has reported this route both ways.
 *  - /blueprints/page/N, 13 meta-refresh redirect stubs that hand-roll their
 *    own <html> and never pass through Layout.
 *
 * Only structural exclusions belong here. /pricing sat on this list while it
 * carried template claims (a trial, a refund guarantee) that a twin would have
 * made cleanly quotable; a content hold like that is the one other reason to
 * add an entry, and it should say when it comes off. twinUrl() falls back to
 * the HTML URL for excluded pages, so /llms.txt links stay valid either way.
 */
const EXCLUDED = [/^\/404\/?$/, /^\/blueprints\/page\/\d+\/?$/];

export function hasMarkdownTwin(pathname: string): boolean {
	const p = pathname.startsWith('/') ? pathname : `/${pathname}`;
	return !EXCLUDED.some((re) => re.test(p));
}
