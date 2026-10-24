/**
 * The /templates pages: every entry of content/domain-list-site.json, shown as
 * its prompt in exactly one category, both on the full list at /templates and
 * on that category's own page.
 *
 * An entry with an industry is listed under its first industry only. An entry
 * without one is listed under its first department only. Later array items
 * are sub-categories and are deliberately not used.
 */
import entries from '~/content/domain-list-site.json';

export const TEMPLATES_PATH = '/templates';

export interface Template {
	name: string;
	title: string;
	prompt: string;
}

export interface TemplateCategory {
	slug: string;
	name: string;
	templates: Template[];
}

export interface TemplateGroup {
	label: string;
	categories: TemplateCategory[];
}

interface Entry {
	name: string;
	title: string;
	prompt: string;
	department?: string[] | null;
	industry?: string[] | null;
}

export const templateCategoryPath = (c: TemplateCategory) => `${TEMPLATES_PATH}/${c.slug}`;

const slugify = (s: string) =>
	s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function group(label: string, pick: (e: Entry) => string | undefined, from: Entry[]): TemplateGroup {
	const byName = new Map<string, Template[]>();
	for (const e of from) {
		const name = pick(e);
		if (!name) continue;
		if (!byName.has(name)) byName.set(name, []);
		byName.get(name)!.push({ name: e.name, title: e.title, prompt: e.prompt });
	}
	const categories = [...byName.entries()]
		.sort(([a], [b]) => a.localeCompare(b, 'en-US'))
		.map(([name, templates]) => ({ slug: slugify(name), name, templates }));
	return { label, categories };
}

const all = entries as Entry[];
const hasIndustry = (e: Entry) => Boolean(e.industry?.[0]);

export const TEMPLATE_GROUPS: TemplateGroup[] = [
	group('By Department', (e) => e.department?.[0], all.filter((e) => !hasIndustry(e))),
	group('By Industry', (e) => e.industry?.[0], all.filter(hasIndustry)),
];

export const TEMPLATE_CATEGORIES: TemplateCategory[] = TEMPLATE_GROUPS.flatMap((g) => g.categories);

// A department and an industry with the same name would share one URL, and one
// page would silently replace the other.
const seen = new Set<string>();
for (const c of TEMPLATE_CATEGORIES) {
	if (seen.has(c.slug)) throw new Error(`Two template categories map to ${TEMPLATES_PATH}/${c.slug}`);
	seen.add(c.slug);
}
