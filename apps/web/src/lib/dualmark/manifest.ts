/**
 * Everything the ROUTE writer emits: Tier A (content collections) and Tier C
 * (hand-written overrides), plus the verbatim blueprint source downloads.
 *
 * Tier B (rendered-HTML extraction) cannot live here: it reads the built HTML,
 * which does not exist until every route has rendered. It runs in the
 * astro:build:done integration instead. Both writers share this module's
 * composition helpers so the output shape is identical either way.
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import {
	buildDocsTree,
	getDocsCollectionNavs,
	flattenNodes,
	findCollectionForPath,
	findTopAncestor,
	type NavNode,
} from '../docs-tree';
import {
	blogPath, BLOG_INDEX_PATH,
	docsPath, DOCS_INDEX_PATH,
	blueprintPath, blueprintBodyPath, blueprintSourcePath, blueprintSlug, BLUEPRINTS_INDEX_PATH,
} from '../routes';
import { extractOverview, extractSubsetMarkdown } from '../models-extract';
import { docHeader, docFooter, listingBody, type RelatedLink, type ListingItem } from './compose';
import { canonicalUrl, relatedLink, twinUrl } from './nav';
import { blueprintDeployHeading, blueprintDeployPrompt } from '../blueprint-deploy';
import { hasMarkdownTwin } from './excluded';
import { fmtDate } from './text';
import { toMarkdownPath, resolveSite } from './paths';

export interface TwinPage {
	/** Canonical HTML path, no trailing slash except the root. */
	path: string;
	/** Complete markdown document. */
	markdown: string;
}

/** Hand-written overrides. Presence is the entire mechanism: no registry. */
const OVERRIDES = import.meta.glob('../../data/twin-overrides/**/*.md', {
	query: '?raw',
	import: 'default',
	eager: true,
}) as Record<string, string>;

/**
 * Verbatim blueprint sources, bundled with import.meta.glob rather than read
 * with node:fs because the Cloudflare adapter prerenders this inside workerd,
 * where fs reads of repo files silently produce empty output.
 */
const RAW_BLUEPRINTS = import.meta.glob('../../../../../blueprints/*.md', {
	query: '?raw',
	import: 'default',
	eager: true,
}) as Record<string, string>;

/** "../../data/twin-overrides/docs/cli.md" -> "/docs/cli" */
function overridePath(globKey: string): string {
	const rel = globKey.split('/twin-overrides/')[1] ?? '';
	const stripped = rel.replace(/\.md$/, '');
	return stripped === 'index' ? '/' : `/${stripped}`;
}

/** Paths claimed by a Tier C file, so the build-time writer skips them. */
export function allOverridePaths(): string[] {
	return Object.keys(OVERRIDES).map(overridePath);
}

type GroupedItem = ListingItem & { group?: string };

export async function getRouteTwins(siteUrl: string): Promise<TwinPage[]> {
	const indexUrl = new URL('/llms.txt', siteUrl).toString();
	const out: TwinPage[] = [];
	// The exclusion list is enforced HERE, not only at the call sites that
	// remember to check. excluded.ts names three consumers that must never
	// disagree, but this one silently did not check: adding /pricing to EXCLUDED
	// suppressed its <link rel="alternate"> and its Tier B extraction while this
	// writer kept emitting the file from source, so the twin stayed published
	// with nothing pointing at it.
	const push = (path: string, markdown: string) => {
		if (!hasMarkdownTwin(path)) return;
		out.push({ path, markdown });
	};

	/* -- blog ----------------------------------------------------------- */

	const posts = (await getCollection('blog')).sort(
		(a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
	);

	const sharingTags = (post: CollectionEntry<'blog'>): RelatedLink[] => {
		const tags = new Set(post.data.tags ?? []);
		if (tags.size === 0) return [];
		return posts
			.filter((p) => p.id !== post.id && (p.data.tags ?? []).some((t) => tags.has(t)))
			.slice(0, 5)
			.map((p) => relatedLink(p.data.title, blogPath(p), siteUrl));
	};

	// The hero image is content-hashed at build time, so its URL is unknowable
	// here. Emit the alt text as its own paragraph and restoreImages() in
	// integration.ts promotes it to a real image once the HTML exists: the same
	// placeholder convention source.ts uses for <Image> in MDX. BlogPost.astro
	// sets alt={title}, which is what makes the two sides meet.
	const heroPlaceholder = (post: CollectionEntry<'blog'>) =>
		post.data.heroImage ? `${post.data.title}\n\n` : '';

	for (const post of posts) {
		push(
			blogPath(post),
			docHeader({
				title: post.data.title,
				description: post.data.description,
				url: canonicalUrl(blogPath(post), siteUrl),
				trail: ['Blog'],
				indexUrl,
				updated: fmtDate(post.data.updatedDate ?? post.data.pubDate),
				facts: [
					['Published', fmtDate(post.data.pubDate)],
					['Tags', post.data.tags?.join(', ')],
				],
			}) +
				heroPlaceholder(post) +
				resolveSite(post.data.markdownTwin ?? '', siteUrl) +
				docFooter(
					[...sharingTags(post), relatedLink('All articles', BLOG_INDEX_PATH, siteUrl)],
					indexUrl,
				),
		);
	}

	push(
		BLOG_INDEX_PATH,
		docHeader({
			title: 'Blog',
			description: 'Writing from the Semantius team.',
			url: canonicalUrl(BLOG_INDEX_PATH, siteUrl),
			trail: ['Blog'],
			indexUrl,
		}) +
			listingBody(
				posts.map((p) => ({
					title: p.data.title,
					href: twinUrl(blogPath(p), siteUrl),
					description: p.data.description,
				})),
			) +
			docFooter([], indexUrl),
	);

	/* -- docs ----------------------------------------------------------- */

	const docs = await getCollection('docs');
	const tree = buildDocsTree(docs);
	const navs = getDocsCollectionNavs(tree);

	for (const doc of docs) {
		const path = docsPath(doc);
		const nav = findCollectionForPath(navs, path) ?? navs[0];
		const tabFolders = nav?.folders ?? [];
		const top = findTopAncestor(tabFolders, path);

		// Mirrors DocsLayout: Docs > tab > section > page, dropping any level
		// that is the page itself so the trail never names the current page.
		const trail = ['Docs'];
		if (nav && nav.node.path !== path) trail.push(nav.label);
		if (top && top.path !== path) trail.push(top.navTitle);

		const flat: NavNode[] = nav?.node.doc
			? [nav.node, ...flattenNodes(tabFolders)]
			: flattenNodes(tabFolders);
		const i = flat.findIndex((n) => n.path === path);
		const prev = i > 0 ? flat[i - 1] : undefined;
		const next = i >= 0 && i < flat.length - 1 ? flat[i + 1] : undefined;

		const related: RelatedLink[] = [];
		if (prev) related.push(relatedLink(prev.navTitle, prev.path, siteUrl));
		if (next) related.push(relatedLink(next.navTitle, next.path, siteUrl));
		related.push(relatedLink('Docs home', DOCS_INDEX_PATH, siteUrl));

		// No source twin means the source could not express the page (a component
		// computes the content). Skipping the push leaves the page unclaimed so
		// the HTML extractor takes it; pushing a header with an empty body would
		// instead ship a twin that looks complete and says nothing.
		if (!doc.data.markdownTwin) continue;

		push(
			path,
			docHeader({
				title: doc.data.title,
				description: doc.data.description,
				url: canonicalUrl(path, siteUrl),
				trail,
				indexUrl,
			}) +
				resolveSite(doc.data.markdownTwin ?? '', siteUrl) +
				docFooter(related, indexUrl),
		);
	}

	const docItems: GroupedItem[] = navs.flatMap((nav) =>
		[nav.node, ...flattenNodes(nav.folders)]
			.filter((n) => n.doc)
			.map((n) => ({
				title: n.navTitle,
				href: twinUrl(n.path, siteUrl),
				description: n.doc?.data.description,
				group: nav.label,
			})),
	);

	push(
		DOCS_INDEX_PATH,
		docHeader({
			title: 'Documentation',
			description: 'Guides and reference for the Semantius agentic data platform.',
			url: canonicalUrl(DOCS_INDEX_PATH, siteUrl),
			trail: ['Docs'],
			indexUrl,
		}) +
			listingBody(docItems, (item) => (item as GroupedItem).group ?? 'Docs') +
			docFooter([], indexUrl),
	);

	/* -- blueprints ------------------------------------------------------ */

	const blueprints = await getCollection('blueprints');
	const domains = await getCollection('domains');
	const modulesByCode = new Map(domains.map((d) => [d.data.code, d.data.modules]));

	// A blueprint names its module in `system_name`; the domain that owns that
	// module carries the buyer-facing copy. Same join the detail page does.
	const domainByModuleCode = new Map<string, CollectionEntry<'domains'>>();
	for (const d of domains) {
		for (const m of d.data.modules) domainByModuleCode.set(m.code, d);
	}
	const domainFor = (bp: CollectionEntry<'blueprints'>) =>
		(bp.data.domain_code
			? domains.find((d) => d.data.code === bp.data.domain_code)
			: undefined) ?? domainByModuleCode.get(bp.data.system_slug.toUpperCase());

	for (const bp of blueprints) {
		const path = blueprintPath(bp);
		const domain = domainFor(bp);

		// Join on system_slug, NOT system_name. A module code is "ATS-BACKGROUND-
		// CHECKS"; system_name is the label "Background Checks" and system_slug is
		// the lowercased code. Comparing code to name matched 0 of 56, so every
		// blueprint silently shipped with no siblings while the relationship data
		// sat in domain-map.json and in related_modules frontmatter.
		const siblings = (domain ? modulesByCode.get(domain.data.code) ?? [] : [])
			.filter((m) => m.code.toLowerCase() !== bp.data.system_slug)
			.slice(0, 8)
			.map((m) => {
				const sib = blueprints.find((b) => b.data.system_slug === m.code.toLowerCase());
				return sib ? relatedLink(m.name, blueprintPath(sib), siteUrl) : null;
			})
			.filter((x): x is RelatedLink => x !== null);

		const trail = ['Blueprints'];
		if (domain) trail.push(domain.data.name);

		const overview = extractOverview(bp.body ?? '');
		const subset = extractSubsetMarkdown(bp.body ?? '');

		// The page's most actionable line is the deploy prompt, and no twin had it.
		// Built from the same module the page uses so the two cannot diverge.
		const deployBlock = [
			`### ${blueprintDeployHeading(bp.data.system_name)}`,
			'',
			'```text',
			blueprintDeployPrompt(new URL(blueprintSourcePath(bp), siteUrl).toString()),
			'```',
		].join('\n');

		// Detail twin mirrors the detail page: overview, deploy prompt, summary.
		push(
			path,
			docHeader({
				title: bp.data.system_name,
				description: bp.data.system_description ?? bp.data.description,
				url: canonicalUrl(path, siteUrl),
				trail,
				indexUrl,
				updated: fmtDate(bp.data.created_at),
				facts: [
					['Domain', domain?.data.name],
					[
						'Full specification',
						new URL(toMarkdownPath(blueprintBodyPath(bp)), siteUrl).toString(),
					],
					['Source file', new URL(blueprintSourcePath(bp), siteUrl).toString()],
				],
			}) +
				[overview, deployBlock, subset].filter(Boolean).join('\n\n') +
				docFooter(
					[
						relatedLink('Full specification', blueprintBodyPath(bp), siteUrl),
						...siblings,
						relatedLink('All blueprints', BLUEPRINTS_INDEX_PATH, siteUrl),
					],
					indexUrl,
				),
		);

		// Full-body twin. The body is already markdown, so it passes through
		// verbatim rather than being round-tripped: blueprint bodies carry
		// mermaid fences where `-->` and `->` are syntax, not punctuation.
		push(
			blueprintBodyPath(bp),
			docHeader({
				title: `${bp.data.system_name}: full specification`,
				description: bp.data.system_description ?? bp.data.description,
				url: canonicalUrl(blueprintBodyPath(bp), siteUrl),
				trail: [...trail, bp.data.system_name],
				indexUrl,
				updated: fmtDate(bp.data.created_at),
				facts: [['Source file', new URL(blueprintSourcePath(bp), siteUrl).toString()]],
			}) +
				(bp.body ?? '') +
				docFooter(
					[
						relatedLink('Blueprint overview', blueprintPath(bp), siteUrl),
						relatedLink('All blueprints', BLUEPRINTS_INDEX_PATH, siteUrl),
					],
					indexUrl,
				),
		);
	}

	// Domain landings are Tier B twins carrying the buyer-facing copy for a whole
	// domain. Listing only blueprints left all 12 reachable from nothing - not
	// from here, not from llms.txt - and a twin nothing links to is unpublished.
	const blueprintSlugs = new Set(blueprints.map((b) => b.data.system_slug));
	const domainItems: GroupedItem[] = domains
		// Mirrors blueprints/[slug]/index.astro: a domain whose code collides with
		// a blueprint slug has no landing page of its own.
		.filter((d) => !blueprintSlugs.has(d.data.code.toLowerCase()))
		.map((d) => ({
			title: d.data.name,
			href: twinUrl(`/blueprints/${d.data.code.toLowerCase()}`, siteUrl),
			description: d.data.catalog_description ?? d.data.description,
			group: 'Domains',
		}));

	const blueprintItems: GroupedItem[] = blueprints.map((bp) => ({
		title: bp.data.system_name,
		href: twinUrl(blueprintPath(bp), siteUrl),
		description: bp.data.system_description ?? bp.data.description,
		group: domainFor(bp)?.data.name ?? 'Other',
	}));

	push(
		BLUEPRINTS_INDEX_PATH,
		docHeader({
			title: 'Semantic blueprints',
			description: 'Ready-made semantic data models you can deploy to a Semantius platform.',
			url: canonicalUrl(BLUEPRINTS_INDEX_PATH, siteUrl),
			trail: ['Blueprints'],
			indexUrl,
		}) +
			listingBody([...domainItems, ...blueprintItems], (item) => (item as GroupedItem).group ?? 'Other') +
			docFooter([], indexUrl),
	);

	/* -- Tier C overrides ------------------------------------------------ */

	// Applied last so a hand-written file always wins over anything generated.
	const byPath = new Map(out.map((t) => [t.path, t]));
	for (const key of Object.keys(OVERRIDES)) {
		const path = overridePath(key);
		const markdown = OVERRIDES[key] ?? '';
		const existing = byPath.get(path);
		if (existing) existing.markdown = markdown;
		else push(path, markdown);
	}

	return out;
}

/**
 * The 56 verbatim blueprint source downloads at /blueprints/<file-id>.md.
 *
 * These are NOT twins: no page exists at /blueprints/<file-id>, so the coverage
 * report excludes them or it would report 56 orphans every build. They are the
 * artifact users paste into an agent (blueprintFileUrl on the detail page
 * interpolates this into a copyable command), so both the bytes, frontmatter
 * included, and the URL shape are frozen.
 */
export async function getBlueprintSources(): Promise<TwinPage[]> {
	const byId = new Map(
		Object.entries(RAW_BLUEPRINTS).map(([file, body]) => [
			file.split('/').pop()!.replace(/\.md$/, ''),
			body,
		]),
	);
	const blueprints = await getCollection('blueprints');
	return blueprints
		.map((bp) => ({ path: blueprintSourcePath(bp), markdown: byId.get(bp.id) ?? '' }))
		.filter((x) => x.markdown !== '');
}

export { blueprintSlug };
