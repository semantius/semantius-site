import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import intro from '~/data/llms-intro.md?raw';
import {
	blogPath, BLOG_INDEX_PATH,
	DOCS_INDEX_PATH,
	blueprintPath, BLUEPRINTS_INDEX_PATH,
	skillPath, SKILLS_INDEX_PATH,
	CHANGELOG_PATH,
} from '~/lib/routes';
import { twinUrl } from '~/lib/dualmark/nav';
import { buildDocsTree, getDocsCollectionNavs, flattenNodes } from '~/lib/docs-tree';

export const prerender = true;

/**
 * The curated index for agents.
 *
 * Generated rather than hand-maintained, which is the point: the previous
 * public/llms.txt was written by hand and its doc links rotted into two-hop
 * redirect chains (/docs/reference/overview -> /docs/overview -> /docs/overview/).
 * Deriving every URL from the same route helpers the pages use makes that class
 * of bug impossible.
 *
 * The prose stays hand-written in src/data/llms-intro.md and is imported with
 * ?raw so it is bundled at build time. It lives in src/data rather than
 * src/content because getNoIndexUrls() in astro.config.mjs walks all of
 * src/content looking for frontmatter.
 *
 * NOTE: public/llms.txt must not exist. A public/ file silently shadows a route
 * with the same output path: Astro logs "Skipping ... because a file with the
 * same name exists in the public folder" and emits nothing.
 *
 * Every link points at the .md twin, so an agent following this index stays in
 * markdown rather than bouncing back into HTML.
 */
export const GET: APIRoute = async ({ site }) => {
	const base = (site ?? new URL('https://www.semantius.com')).toString();
	const md = (path: string) => twinUrl(path, base);

	const [docs, blog, blueprints, domains, catalogs] = await Promise.all([
		getCollection('docs'),
		getCollection('blog'),
		getCollection('blueprints'),
		getCollection('domains'),
		getCollection('catalogs'),
	]);

	const out: string[] = [intro.trim(), ''];

	const section = (title: string, lines: string[]) => {
		if (lines.length === 0) return;
		out.push(`## ${title}`, '', ...lines, '');
	};

	// Docs, grouped by nav tab so the structure matches what a reader sees.
	const navs = getDocsCollectionNavs(buildDocsTree(docs));
	for (const nav of navs) {
		const nodes = [nav.node, ...flattenNodes(nav.folders)].filter((n) => n.doc);
		section(
			`Documentation: ${nav.label}`,
			nodes.map((n) => {
				const desc = n.doc?.data.description;
				return `- [${n.navTitle}](${md(n.path)})${desc ? `: ${desc}` : ''}`;
			}),
		);
	}
	section('Documentation index', [`- [All documentation](${md(DOCS_INDEX_PATH)})`]);

	section('Product', [
		`- [Features](${md('/features')}): what the platform does.`,
		`- [Pricing](${md('/pricing')}): open source and managed plans.`,
		`- [About](${md('/about')}): why Semantius exists.`,
		`- [License](${md('/license')}): MIT.`,
		`- [Changelog](${md(CHANGELOG_PATH)}): version history.`,
	]);

	// Blueprints grouped by owning domain. 56 entries is a lot for one list, so
	// the grouping is what makes it navigable.
	const domainByModule = new Map<string, string>();
	for (const d of domains) {
		for (const m of d.data.modules) domainByModule.set(m.code, d.data.name);
	}
	const byDomain = new Map<string, string[]>();
	for (const bp of blueprints) {
		const group = domainByModule.get(bp.data.system_name) ?? 'Other';
		const desc = bp.data.system_description ?? bp.data.description;
		const line = `- [${bp.data.system_name}](${md(blueprintPath(bp))})${desc ? `: ${desc}` : ''}`;
		const existing = byDomain.get(group);
		if (existing) existing.push(line);
		else byDomain.set(group, [line]);
	}
	section('Semantic blueprints', [
		`- [All blueprints](${md(BLUEPRINTS_INDEX_PATH)}): the full catalog.`,
	]);
	for (const [domain, lines] of byDomain) section(`Blueprints: ${domain}`, lines);

	section('Agent skills', [
		`- [All skills](${md(SKILLS_INDEX_PATH)}): the full library.`,
		...catalogs.map((c) => {
			const desc = c.data.catalog_tagline ?? c.data.catalog_description;
			return `- [${c.data.domain_name}](${md(skillPath(c))})${desc ? `: ${desc}` : ''}`;
		}),
	]);

	section('Blog', [
		`- [All articles](${md(BLOG_INDEX_PATH)})`,
		...blog
			.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
			.map((p) => `- [${p.data.title}](${md(blogPath(p))}): ${p.data.description}`),
	]);

	return new Response(`${out.join('\n').replace(/\n{3,}/g, '\n\n').trim()}\n`, {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	});
};
