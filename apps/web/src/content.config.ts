import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob, file } from 'astro/loaders';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { execFileSync } from 'node:child_process';
import matter from 'gray-matter';
import { ROADMAP_DISCUSSIONS_REPO, ROADMAP_CATEGORY_SLUG } from './lib/roadmap';

const blogCollection = defineCollection({
    loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
	// Type-check frontmatter using a schema
	schema: ({ image }) => z.object({
		title: z.string(),
		description: z.string(),
		pubDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		heroImage: image().optional(),
        tags: z.array(z.string()).optional(),
        youtubeId: z.string().optional(),
        audioUrl: z.string().optional(),
        isVideo: z.boolean().optional().default(false),
        noindex: z.boolean().optional().default(false),
        nofollow: z.boolean().optional().default(false),
	}),
});

const docsCollection = defineCollection({
    loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/docs" }),
    schema: z.object({
        title: z.string(),
        navTitle: z.string().optional(),
        // The <title>, when the short H1 alone would not say which product or
        // section a search result or AI citation belongs to.
        seoTitle: z.string().optional(),
        description: z.string(),
        order: z.number().optional(),
        noindex: z.boolean().optional().default(false),
        nofollow: z.boolean().optional().default(false),
    }),
});

const changelogCollection = defineCollection({
    loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/changelog" }),
    schema: z.object({
        version: z.string(),
        title: z.string(),
        description: z.string(),
        pubDate: z.coerce.date(),
        type: z.enum(['major', 'feature', 'security', 'fix', 'improvement', 'planned', 'other']).default('feature'),
        isSecurity: z.boolean().optional().default(false),
        detailsUrl: z.string().optional(),
        migrationUrl: z.string().optional(),
        noindex: z.boolean().optional().default(false),
        nofollow: z.boolean().optional().default(false),
    }),
});

// Skills live at /skills in the repo root (two levels above apps/web).
// Each skill folder contains SKILL.md (technical agent spec) and README.mdx
// (human-friendly overview). The collection loads README.mdx as the primary
// renderable entry so that render() yields the README content on skill pages.
// The custom loader also reads SKILL.md via gray-matter to merge technical
// metadata (name, semantic_model, generated_from) and stores the SKILL.md body
// in the skillBody field for the raw-skill view at /skills/[slug]/skill.
const baseSkillsGlob = glob({ pattern: '*/README.mdx', base: '../../skills' });
const skillsCollection = defineCollection({
    loader: {
        name: 'skills',
        load: async (ctx) => {
            await baseSkillsGlob.load(ctx);
            for (const [id, entry] of ctx.store.entries()) {
                const e = entry as {
                    body?: string;
                    data: Record<string, unknown>;
                    filePath?: string;
                    rendered?: unknown;
                    deferredRender?: boolean;
                };
                // Read the sibling SKILL.md to get technical metadata.
                let skillData: Record<string, unknown> = {};
                let skillBody = '';
                if (e.filePath) {
                    const skillFilePath = path.join(path.dirname(e.filePath), 'SKILL.md');
                    if (fs.existsSync(skillFilePath)) {
                        const raw = fs.readFileSync(skillFilePath, 'utf-8');
                        const parsed = matter(raw);
                        skillData = parsed.data;
                        skillBody = parsed.content.trim();
                    }
                }
                const mergedData = {
                    // README.mdx frontmatter: human-friendly title and description.
                    title: e.data.title,
                    description: e.data.description,
                    // SKILL.md frontmatter: technical metadata.
                    name: skillData.name,
                    semantic_model: skillData.semantic_model,
                    generated_from: skillData.generated_from,
                    noindex: skillData.noindex ?? false,
                    nofollow: skillData.nofollow ?? false,
                    // SKILL.md body stored for rendering on the raw-skill page.
                    skillBody,
                };
                const newData = await ctx.parseData({ id, data: mergedData, filePath: e.filePath });
                ctx.store.set({
                    id,
                    data: newData,
                    body: e.body,
                    filePath: e.filePath,
                    digest: ctx.generateDigest(JSON.stringify(newData)),
                    rendered: e.rendered as never,
                    deferredRender: e.deferredRender,
                });
            }
        },
    },
    schema: z.object({
        title: z.string(),
        description: z.string(),
        name: z.string().optional(),
        semantic_model: z.string().optional(),
        generated_from: z.string().optional(),
        noindex: z.boolean().optional().default(false),
        nofollow: z.boolean().optional().default(false),
        skillBody: z.string().optional(),
    }),
});

// The domain map (../../domain-map/domain-map.json, repo root) is the single
// source of truth for the domains; the skills index uses it for their order and
// selection. Loaded via the `file` loader (path is relative to the Astro project
// root). The parser lifts the nested `domains` array and stamps an `id`
// (required by the file loader) and `order` (preserves source order).
const domainsCollection = defineCollection({
    loader: file('../../domain-map/domain-map.json', {
        parser: (text) =>
            (JSON.parse(text).domains as Array<Record<string, unknown>>).map((d, i) => ({
                ...d,
                id: d.code as string,
                order: i,
            })),
    }),
    // Only the fields the listing needs are declared; zod drops the rest
    // (personas, processes, related_modules, etc.).
    schema: z.object({
        code: z.string(),
        name: z.string(),
        // `description` is the internal/technical blurb; `catalog_description` is
        // the buyer-facing copy and is preferred for display (same convention as
        // the module fields below).
        description: z.string(),
        catalog_description: z.string().optional(),
        domain_kind: z.string().optional(),
        order: z.number().default(0),
        modules: z
            .array(
                z.object({
                    code: z.string(),
                    name: z.string(),
                    // `description` is the internal/technical blurb; `catalog_description`
                    // is the buyer-facing copy and is preferred for display.
                    description: z.string(),
                    catalog_description: z.string().optional(),
                }),
            )
            .default([]),
    }),
});

// Per-domain catalog copy that backs the /skills listing. One catalog.yaml per
// domain lives at ../../skill-specs/<DOMAIN_CODE>/catalog.yaml (repo root,
// emitted from the catalog DB). The glob loader parses YAML data files natively;
// each entry carries domain_code so pages can join it to the `domains` map.
const catalogsCollection = defineCollection({
    loader: glob({ pattern: '*/catalog.yaml', base: '../../skill-specs' }),
    schema: z.object({
        domain_code: z.string(),
        domain_code_lower: z.string().optional(),
        domain_name: z.string(),
        catalog_tagline: z.string().optional(),
        catalog_description: z.string().optional(),
        skill_name: z.string().optional(),
        module_slug: z.string().optional(),
        capability_names: z.array(z.string()).default([]),
    }),
});

// The roadmap entries are the discussions in the "Roadmap" category of the
// semantius organization's GitHub Discussions (see lib/roadmap.ts), fetched with
// the `gh` CLI at build time. This has to be a content loader: loaders run in
// Node, while a route prerenders in workerd, where child_process does not exist.
// `gh` must be installed and authenticated (locally `gh auth login`, in CI the
// GH_TOKEN env var); if it fails, execFileSync throws and the build fails.
const ghGraphql = (query: string, vars: Record<string, string>, jq: string, paginate = false): string =>
    execFileSync(
        'gh',
        [
            'api', 'graphql',
            ...(paginate ? ['--paginate'] : []),
            '-f', `query=${query}`,
            ...Object.entries(vars).flatMap(([k, v]) => ['-f', `${k}=${v}`]),
            '--jq', jq,
        ],
        { encoding: 'utf-8', maxBuffer: 64 * 1024 * 1024 },
    );

const roadmapCollection = defineCollection({
    loader: {
        name: 'roadmap',
        load: async ({ store, parseData, generateDigest }) => {
            const repo = { owner: ROADMAP_DISCUSSIONS_REPO.owner, name: ROADMAP_DISCUSSIONS_REPO.name };
            const categoryId = ghGraphql(
                'query($owner: String!, $name: String!, $slug: String!) { repository(owner: $owner, name: $name) { discussionCategory(slug: $slug) { id } } }',
                { ...repo, slug: ROADMAP_CATEGORY_SLUG },
                '.data.repository.discussionCategory.id',
            ).trim();
            // `--paginate` follows pageInfo.endCursor; `@json` prints one discussion per line.
            const lines = ghGraphql(
                'query($owner: String!, $name: String!, $categoryId: ID!, $endCursor: String) { repository(owner: $owner, name: $name) { discussions(first: 100, after: $endCursor, categoryId: $categoryId, orderBy: {field: CREATED_AT, direction: DESC}) { nodes { number title url labels(first: 100) { nodes { name } } } pageInfo { hasNextPage endCursor } } } }',
                { ...repo, categoryId },
                '.data.repository.discussions.nodes[] | {number, title, url, labels: [.labels.nodes[].name]} | @json',
                true,
            ).split('\n').filter((line) => line.trim() !== '');
            // Replace the whole set, so a discussion that was deleted or moved out
            // of the category does not survive in the content-layer cache.
            store.clear();
            for (const [order, line] of lines.entries()) {
                const d = JSON.parse(line) as { number: number; title: string; url: string; labels: string[] };
                const id = String(d.number);
                const data = await parseData({ id, data: { ...d, order } });
                store.set({ id, data, digest: generateDigest(data) });
            }
        },
    },
    schema: z.object({
        number: z.number(),
        title: z.string(),
        url: z.string(),
        labels: z.array(z.string()),
        // Position in the order GitHub returned them: newest first.
        order: z.number(),
    }),
});

export const collections = {
	'blog': blogCollection,
    'roadmap': roadmapCollection,
    'docs': docsCollection,
    'changelog': changelogCollection,
    'skills': skillsCollection,
    'domains': domainsCollection,
    'catalogs': catalogsCollection,
};
