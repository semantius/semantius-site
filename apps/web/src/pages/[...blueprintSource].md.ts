import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { blueprintSourcePath } from '~/lib/routes';

export const prerender = true;

/**
 * The verbatim blueprint files, offered as downloads at the URL
 * blueprintSourcePath() gives (/blueprints/source/<id>.md).
 *
 * These are NOT markdown twins: no HTML page exists at that path, and the
 * twins are written by src/lib/mdtwins/. A blueprint page interpolates this
 * URL into a copyable command, so both the bytes (frontmatter included) and
 * the URL shape are frozen.
 *
 * A root catch-all rather than blueprints/source/[id].md.ts, so the URL comes
 * from blueprintSourcePath() alone instead of being spelled a second time by
 * this file's location. Why a catch-all with a `.md` suffix works, verified
 * against Astro 7.3.3's router: getParts() splits "[...blueprintSource].md"
 * into a spread and the literal ".md", so the pattern /^\/(.*?)\.md\/?$/
 * matches across slashes, and validateSegment() only rejects a non-standalone
 * rest parameter in .astro files. Renaming this file to .astro, or moving the
 * .md suffix, breaks the build.
 */

/**
 * Bundled with import.meta.glob rather than read with node:fs because the
 * Cloudflare adapter prerenders this route inside workerd, where fs reads of
 * repo files silently produce empty output.
 */
const RAW_BLUEPRINTS = import.meta.glob('../../../../blueprints/*.md', {
	query: '?raw',
	import: 'default',
	eager: true,
}) as Record<string, string>;

export async function getStaticPaths() {
	const byId = new Map(
		Object.entries(RAW_BLUEPRINTS).map(([file, body]) => [
			file.split('/').pop()!.replace(/\.md$/, ''),
			body,
		]),
	);
	const blueprints = await getCollection('blueprints');
	return blueprints
		.map((bp) => ({ path: blueprintSourcePath(bp), markdown: byId.get(bp.id) ?? '' }))
		.filter((x) => x.markdown !== '')
		.map(({ path, markdown }) => ({
			// "/blueprints/source/x.md" -> "blueprints/source/x"
			params: { blueprintSource: path.slice(1, -3) },
			props: { markdown },
		}));
}

export const GET: APIRoute = ({ props }) =>
	// Only the BODY survives a static build: Astro writes it to disk and drops
	// these headers, because the Cloudflare adapter declares no staticHeaders
	// feature. The real headers come from public/_headers. This content type is
	// still correct in `astro dev`.
	new Response(props.markdown as string, {
		headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
	});
