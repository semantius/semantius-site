import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import intro from '~/data/llms-intro.md?raw';
import install from '~/data/llms-install.md?raw';
import {
	blogPath, BLOG_INDEX_PATH,
	docsPath, docsSlug, DOCS_INDEX_PATH,
	skillPath, SKILLS_INDEX_PATH,
	CHANGELOG_PATH,
} from '~/lib/routes';
import { TEMPLATE_CATEGORIES, TEMPLATES_PATH, templateCategoryPath } from '~/data/templates';
import { twinUrl } from '~/lib/mdtwins/paths';
import { buildDocsTree, getDocsCollectionNavs, tabPages } from '~/lib/docs-tree';
import { SOLUTIONS } from '~/data/solutions';
import { SAMPLE_PROMPTS, promptPath } from '~/data/sample-prompts';
import { SPECIFICATION } from '~/data/specification';

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
 * The prose stays hand-written in src/data/llms-intro.md and
 * src/data/llms-install.md and is imported with ?raw so it is bundled at build
 * time. It lives in src/data rather than
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

	// Right below the intro: setting Semantius up is the first thing an agent
	// does for its user. This is the agent version of the CLI README's Quick
	// Start; the sample-prompt pages show their own steps (data/install-steps.ts).
	section('Install', [install.trim()]);

	// Right after Install, so an agent sees early where the ideas for modules
	// are. One page per category, each listing its template prompts by title.
	section('Templates', [
		`[All templates](${md(TEMPLATES_PATH)}) contains ideas for modules: template prompts to build Semantius modules, grouped by category.`,
		'',
		...TEMPLATE_CATEGORIES.map(
			(c) =>
				`- [${c.name} templates](${md(templateCategoryPath(c))}): ` +
				c.templates.map((t) => t.title).join(', '),
		),
	]);

	// The founder's v1 specification, §10. The solution pages carry their reader
	// labels and summaries (change request 3, §7); the hub's and the prompt
	// pages' summaries are not written yet (home-tbd.md, A5).
	const summaryTbd = 'TBD: one-sentence summary with its qualifier. Not written yet.';
	section('Pages', [
		`- [Home](${md('/')}): ${summaryTbd}`,
		...Object.values(SOLUTIONS).map((s) => `- [${s.readerLabel}](${md(s.path)}): ${s.summary}`),
		...SAMPLE_PROMPTS.map((p) => `- [${p.heading}](${md(promptPath(p.slug))}): ${summaryTbd}`),
	]);
	// A row's name links to the docs page that backs it. A slug that matches no
	// docs page leaves the name unlinked.
	const docsBySlug = new Map(docs.map((d) => [docsSlug(d), d]));
	section('Specification', [
		'| | |',
		'|---|---|',
		...SPECIFICATION.map(([name, value, slug]) => {
			const doc = slug ? docsBySlug.get(slug) : undefined;
			return `| ${doc ? `[${name}](${md(docsPath(doc))})` : name} | ${value} |`;
		}),
	]);
	section('What Semantius is not', [
		"- Not an agent: it doesn't act on its own. Your agent sets it up and works in it.",
		'- Not a code generator: there is no source code to maintain. The model, the rules (JSONLogic) and the permissions are data in Postgres that the API and the app read at runtime.',
	]);

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

	// Hand-enumerated, so anything added to the site has to be added here too
	// (or to Optional below). Three twins (design, privacy, terms) were
	// published and linked from nothing at all until they were listed.
	section('Product', [
		`- [Features](${md('/features')}): what the platform does.`,
		`- [Pricing](${md('/pricing')}): cloud plans paid in credits, and free self-hosting with paid support.`,
		`- [About](${md('/about')}): why Semantius exists.`,
		`- [Contact](${md('/contact')}): how to reach the team.`,
		`- [License](${md('/license')}): MIT.`,
		`- [Changelog](${md(CHANGELOG_PATH)}): version history.`,
	]);

	// The domain skills, one per skill-specs/<CODE>/catalog.yaml. There are none
	// for now (use-semantius is the only skill), so the section is left out. When
	// catalogs return, it comes back by itself, but its links need the /skills
	// pages restored and their redirects removed from redirects.jsonc first.
	if (catalogs.length > 0) {
		section('Agent skills', [
			`- [All skills](${md(SKILLS_INDEX_PATH)}): the full library.`,
			...catalogs.map((c) => {
				const desc = c.data.catalog_tagline ?? c.data.catalog_description;
				return `- [${c.data.domain_name}](${md(skillPath(c))})${desc ? `: ${desc}` : ''}`;
			}),
		]);
	}

	// The llmstxt.org spec gives "## Optional" a meaning: links an agent can skip
	// when it needs a shorter context. It has to stay the last section.
	section('Optional', [
		`- [Blog](${md(BLOG_INDEX_PATH)}): all articles.`,
		...blog
			.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
			.map((p) => `- [${p.data.title}](${md(blogPath(p))}): ${p.data.description}`),
		`- [Design system](${md('/design')}): typography, color and component reference.`,
		`- [Bot simulator](${md('/botsim')}): proof of concept of a simulated agent workspace: named agents take tasks, work in parallel, and come back when they need you.`,
		`- [Privacy](${md('/privacy')}): how data is handled.`,
		`- [Terms](${md('/terms')}): terms of service.`,
	]);

	return new Response(`${out.join('\n').replace(/\n{3,}/g, '\n\n').trim()}\n`, {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	});
};
