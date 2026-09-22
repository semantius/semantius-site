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
 *  - /404, which is an error page, not content. Note Astro reports its
 *    pathname as "/404/" even though the emitted file is 404.html.
 *  - /blueprints/page/N, 13 meta-refresh redirect stubs that hand-roll their
 *    own <html> and never pass through Layout.
 */
const EXCLUDED = [/^\/404\/?$/, /^\/blueprints\/page\/\d+\/?$/];

export function hasMarkdownTwin(pathname: string): boolean {
	const p = pathname.startsWith('/') ? pathname : `/${pathname}`;
	return !EXCLUDED.some((re) => re.test(p));
}
