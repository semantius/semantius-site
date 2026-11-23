/**
 * Where the public roadmap lives.
 *
 * The roadmap is the "Roadmap" category of the semantius organization's GitHub
 * Discussions. Organization discussions are stored in a source repository
 * (`semantius/semantius`), which is what the API has to be asked for, while the
 * public URLs live under github.com/orgs/semantius.
 *
 * This module holds constants only, so the page can import it without pulling
 * node:child_process into the workerd prerender bundle. The `roadmap` content
 * loader in content.config.ts does the fetching.
 */
export const ROADMAP_DISCUSSIONS_REPO = { owner: 'semantius', name: 'semantius' } as const;

/** The category slug, as in the category URL below. */
export const ROADMAP_CATEGORY_SLUG = 'roadmap';

/** The category's display name, which GitHub's `category:` search qualifier takes. */
export const ROADMAP_CATEGORY_NAME = 'Roadmap';

export const ROADMAP_URL = `https://github.com/orgs/semantius/discussions/categories/${ROADMAP_CATEGORY_SLUG}`;

/**
 * The roadmap filtered to one label, e.g. `?discussions_q=label%3Aplatform+category%3ARoadmap`.
 * A label containing whitespace (`pg_semantius CLI`) must be quoted, or GitHub
 * reads only its first word as the label.
 */
export const roadmapLabelUrl = (label: string): string => {
	const term = /\s/.test(label) ? `"${label}"` : label;
	const params = new URLSearchParams({ discussions_q: `label:${term} category:${ROADMAP_CATEGORY_NAME}` });
	return `${ROADMAP_URL}?${params}`;
};
