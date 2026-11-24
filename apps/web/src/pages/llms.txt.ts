import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import intro from '~/data/llms-intro.md?raw';
import {
	blogPath, BLOG_INDEX_PATH,
	DOCS_INDEX_PATH,
	skillPath, SKILLS_INDEX_PATH,
	CHANGELOG_PATH,
} from '~/lib/routes';
import { TEMPLATE_CATEGORIES, TEMPLATES_PATH, templateCategoryPath } from '~/data/templates';
import { twinUrl } from '~/lib/mdtwins/paths';
import { buildDocsTree, getDocsCollectionNavs, tabPages } from '~/lib/docs-tree';
import { SOLUTIONS } from '~/data/solutions';
import { SAMPLE_PROMPTS, promptPath } from '~/data/sample-prompts';
import { SPECIFICATION } from '~/data/specification';
import { INSTALL_CLI, INSTALL_SKILL, OPENCLAW_NOTE } from '~/data/install-steps';

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
	// astro.config.mjs always sets `site`.
	const base = site!.toString();
	const md = (path: string) => twinUrl(path, base);

	const [docs, blog, catalogs] = await Promise.all([
		getCollection('docs'),
		getCollection('blog'),
		getCollection('catalogs'),
	]);

	const out: string[] = [intro.trim(), ''];

	const section = (title: string, lines: string[]) => {
		if (lines.length === 0) return;
		out.push(`## ${title}`, '', ...lines, '');
	};

	// The founder's v1 specification, §10. The solution pages carry their reader
	// labels and summaries (change request 3, §7); the hub's and the prompt
	// pages' summaries are not written yet (home-tbd.md, A5).
	const summaryTbd = 'TBD: one-sentence summary with its qualifier. Not written yet.';
	section('Pages', [
		`- [Home](${md('/')}): ${summaryTbd}`,
		...Object.values(SOLUTIONS).map((s) => `- [${s.readerLabel}](${md(s.path)}): ${s.summary}`),
		...SAMPLE_PROMPTS.map((p) => `- [${p.heading}](${md(promptPath(p.slug))}): ${summaryTbd}`),
	]);
	section('Specification', [
		'| | |',
		'|---|---|',
		...SPECIFICATION.map(([name, value]) => `| ${name} | ${value} |`),
	]);
	section('Install', [
		`1. Install the CLI: \`${INSTALL_CLI}\``,
		`2. Install the skill: \`${INSTALL_SKILL}\`. ${OPENCLAW_NOTE}`,
	]);
	section('Agents it works with', [
		'The one you already use, as long as it can run commands on its own computer: always-on agents such as Meta Muse, OpenAI Dots or Grok Bot, or Claude Code, Codex, OpenClaw and Hermes Agent.',
	]);
	section('What Semantius is not', ['- Not analytics.', '- Not an agent.', '- Not a code generator.']);

	// Docs, grouped by nav tab so the structure matches what a reader sees.
	const navs = getDocsCollectionNavs(buildDocsTree(docs));
	for (const nav of navs) {
		const nodes = tabPages(nav).filter((n) => n.doc);
		section(
			`Documentation: ${nav.label}`,
			nodes.map((n) => {
				const desc = n.doc?.data.description;
				return `- [${n.navTitle}](${md(n.path)})${desc ? `: ${desc}` : ''}`;
			}),
		);
	}
	section('Documentation index', [`- [All documentation](${md(DOCS_INDEX_PATH)})`]);

	// Hand-enumerated, so anything added to the site has to be added here too.
	// Three twins (design, privacy, terms) were published and linked from
	// nothing at all until they were listed.
	section('Product', [
		`- [Features](${md('/features')}): what the platform does.`,
		`- [Pricing](${md('/pricing')}): cloud plans paid in credits, and free self-hosting with paid support.`,
		`- [About](${md('/about')}): why Semantius exists.`,
		`- [Contact](${md('/contact')}): how to reach the team.`,
		`- [License](${md('/license')}): MIT.`,
		`- [Changelog](${md(CHANGELOG_PATH)}): version history.`,
		`- [Design system](${md('/design')}): typography, color and component reference.`,
		`- [Privacy](${md('/privacy')}): how data is handled.`,
		`- [Terms](${md('/terms')}): terms of service.`,
		`- [Bot simulator](${md('/botsim')}): proof of concept of a simulated agent workspace: named agents take tasks, work in parallel, and come back when they need you.`,
	]);

	section('Agent skills', [
		`- [All skills](${md(SKILLS_INDEX_PATH)}): the full library.`,
		...catalogs.map((c) => {
			const desc = c.data.catalog_tagline ?? c.data.catalog_description;
			return `- [${c.data.domain_name}](${md(skillPath(c))})${desc ? `: ${desc}` : ''}`;
		}),
	]);

	// One page per category, each listing its sample prompts by title.
	section('Templates', [
		`- [All templates](${md(TEMPLATES_PATH)}): every category on one page.`,
		...TEMPLATE_CATEGORIES.map(
			(c) =>
				`- [${c.name} templates](${md(templateCategoryPath(c))}): ` +
				c.templates.map((t) => t.title).join(', '),
		),
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
