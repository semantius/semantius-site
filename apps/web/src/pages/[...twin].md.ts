import type { APIRoute } from 'astro';
import { getRouteTwins, getBlueprintSources } from '~/lib/dualmark/manifest';

export const prerender = true;

/**
 * Every markdown twin the route writer produces, at <page-url>.md.
 *
 * Why a root catch-all with a `.md` suffix works, verified against Astro
 * 7.3.3's router rather than assumed, because it looks like it should collide
 * with blog/[...slug].astro and docs/[...slug].astro:
 *
 *  - getParts() splits "[...twin].md" into two parts, a spread and the literal
 *    ".md", so the segment has length 2 and getPattern() skips its
 *    single-spread special case. The emitted pattern is /^\/(.*?)\.md\/?$/,
 *    whose (.*?) is unrestricted and therefore matches across slashes.
 *  - validateSegment() only rejects a non-standalone rest parameter for files
 *    ending in .astro, so a .ts endpoint is exempt. Renaming this file to
 *    .astro, or moving the .md suffix, breaks the build.
 *  - A static build never routes: each route generates its own files from its
 *    own getStaticPaths and the output paths are disjoint.
 *  - In dev, routeComparator sorts /blog/[...slug] ahead of /[...twin].md, but
 *    matchRoute() in astro/dist/core/routing/dev.js iterates ALL matches and
 *    continues on NoMatchingStaticPathFound, so /blog/post.md falls through to
 *    this route.
 *
 * Tier B twins (rendered-HTML extraction) are NOT here: they need the built
 * HTML, which does not exist until every route has rendered. The markdownTwins
 * integration in astro.config.mjs writes those in astro:build:done.
 */
export async function getStaticPaths() {
	// Astro's resolved `site`, which astro.config.mjs computes BEFORE Vite merges
	// apps/web/.env into process.env. Reading process.env.SITE_URL here instead
	// would yield the dev server URL (http://localhost:4321) in a production
	// build, which is exactly the bug the SITE_PLACEHOLDER indirection exists for.
	const site = import.meta.env.SITE || 'https://www.semantius.com';
	const [twins, sources] = await Promise.all([getRouteTwins(site), getBlueprintSources()]);

	const seen = new Set<string>();
	const paths: Array<{ params: { twin: string }; props: { markdown: string } }> = [];

	for (const entry of [...twins, ...sources]) {
		// The twin path and the .md route param differ: "/docs/cli" becomes the
		// param "docs/cli" so the route emits dist/client/docs/cli.md. The
		// blueprint sources already carry their .md suffix.
		const param = entry.path.endsWith('.md')
			? entry.path.slice(1, -3)
			: entry.path === '/'
				? 'index'
				: entry.path.slice(1);

		// The blueprint source namespace (file ids, all ending -semantic-blueprint)
		// and the twin namespace (system slugs) are disjoint today. If that ever
		// stops being true one file would silently overwrite the other, so fail
		// loudly here instead. This is the one hard failure in the feature, and it
		// guards data loss rather than output quality.
		if (seen.has(param)) {
			throw new Error(
				`Duplicate markdown output path: /${param}.md. The blueprint source ids and ` +
					`page slugs have collided; one file would overwrite the other.`,
			);
		}
		seen.add(param);
		paths.push({ params: { twin: param }, props: { markdown: entry.markdown } });
	}

	return paths;
}

export const GET: APIRoute = ({ props }) =>
	// Only the BODY survives a static build: Astro writes the response body to
	// disk and discards these headers, because the Cloudflare adapter declares
	// no staticHeaders feature. The real headers come from public/_headers.
	// This content type is still correct in `astro dev`, which is why it is set.
	new Response(props.markdown as string, {
		headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
	});
