import type { APIRoute } from 'astro';
import { getRouteTwins } from '~/lib/dualmark/manifest';
import { toMarkdownPath } from '~/lib/dualmark/paths';

export const prerender = true;

/**
 * A complete index of every markdown twin, one per line, with its title.
 *
 * Deliberately an INDEX, not a concatenation of the site. A true full-text dump
 * would be about 2 MB, 97 percent of it blueprint entity tables, which no agent
 * can usefully hold in context and which goes stale the moment any page
 * changes. Note also that llms-full.txt appears in no specification: it is a
 * convention, so we are free to make it the useful artifact rather than the
 * literal one.
 *
 * This lists only the twins the route writer knows about (Tier A and Tier C).
 * Tier B twins, the marketing and listing pages extracted from rendered HTML,
 * are not enumerable here because they are produced after all routes render.
 * They are reachable from llms.txt and from each page's rel="alternate" link.
 */
export const GET: APIRoute = async ({ site }) => {
	const base = (site ?? new URL('https://www.semantius.com')).toString();
	const twins = await getRouteTwins(base);

	const lines = twins
		.map((twin) => {
			// The title is the first "# " heading the document carries, which
			// docHeader always emits.
			const title = twin.markdown.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? twin.path;
			return { url: new URL(toMarkdownPath(twin.path), base).toString(), title };
		})
		.sort((a, b) => a.url.localeCompare(b.url));

	const body = [
		'# Semantius: index of documentation, blog and blueprint markdown twins',
		'',
		'Every URL below serves markdown. The HTML page for each is the same URL',
		'without the ".md" suffix and with a trailing slash.',
		'',
		'This lists the documentation, blog and blueprint twins. Marketing and',
		'listing pages also have twins, reachable from llms.txt and from the',
		'rel="alternate" link tag on each page.',
		'',
		`Curated, grouped index: ${new URL('/llms.txt', base).toString()}`,
		'',
		...lines.map((l) => `${l.url}\t${l.title}`),
		'',
	].join('\n');

	return new Response(body, {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	});
};
