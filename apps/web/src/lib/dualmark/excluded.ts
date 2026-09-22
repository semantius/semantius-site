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
 *  - /pricing, TEMPORARILY. This one is not structural, it is a content hold.
 *    The page still carries template placeholder copy: the FAQ states a 14-day
 *    Pro trial, card/PayPal/wire payment and a 30-day money-back guarantee,
 *    while every price on the same page renders as "X/month". In HTML that text
 *    is buried in markup, which is where it has always been; a twin turns it
 *    into the clean, quotable statement an answer engine will repeat as a
 *    commercial commitment, and a quoted claim cannot be retracted the way a
 *    page can. Excluding it keeps this page exactly as crawlable as it is today
 *    and no more.
 *
 *    REMOVE THIS ENTRY once the pricing copy is real or a hand-written twin
 *    lands at src/data/twin-overrides/pricing.md. Tracked as item 1 in
 *    aeo-followup.md and as the release blocker in aeo-next-session.md.
 *    Nothing else needs changing when it goes: twinUrl() already falls back to
 *    the HTML URL for excluded pages, so /llms.txt links stay valid either way.
 */
const EXCLUDED = [/^\/404\/?$/, /^\/blueprints\/page\/\d+\/?$/, /^\/pricing\/?$/];

export function hasMarkdownTwin(pathname: string): boolean {
	const p = pathname.startsWith('/') ? pathname : `/${pathname}`;
	return !EXCLUDED.some((re) => re.test(p));
}
