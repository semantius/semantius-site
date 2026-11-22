/**
 * HTML to markdown: the only converter of the twins.
 *
 * Every twin is made from its page's built HTML, never from the page's source.
 * The HTML IS the page: whatever a template says, a component computes or a
 * remark plugin adds is in it, so a twin made from it cannot say something the
 * page does not. Converting the source instead would be a second renderer, and
 * a second renderer drifts (see README.md).
 *
 * Every rule here maps HTML structure to markdown and never names a page or
 * carries page text. It reads what the HTML already says: standard elements
 * and link relations, Shiki's data-language, and the class names the mermaid
 * diagrams and the command box already carry. No page carries markup for the
 * twin's sake; data-pagefind-ignore belongs to site search, which shares the
 * NON_CONTENT list below.
 *
 * Runs in Node only, from the build hook and the dev middleware in
 * integration.ts, never from a prerendered route.
 */
import { unified } from 'unified';
import rehypeParse from 'rehype-parse';
import rehypeRemark from 'rehype-remark';
import remarkGfm from 'remark-gfm';
import remarkStringify from 'remark-stringify';
import { visit, SKIP } from 'unist-util-visit';
import { collapseBlankLines } from './text';
import { isPagePath, twinUrl } from './paths';

const STRINGIFY_OPTIONS = {
	bullet: '-' as const,
	emphasis: '_' as const,
	fences: true,
	rule: '-' as const,
	// remark-stringify does not hard-wrap by default in v11, which is what we
	// want: hard-wrapped markdown chunks badly when an agent splits it.
};

/* -------------------------------------------------------------------------- */
/* what is content                                                             */
/* -------------------------------------------------------------------------- */

/**
 * What is not content, shared with site search. pagefindIndex() in
 * astro.config.mjs hands nonContentSelectors() to Pagefind and contentRegion()
 * below drops the same elements, so marking a region data-pagefind-ignore
 * removes it from search and from the twin at once. Kept as data rather than
 * as CSS selector strings so both sides can use it without a selector engine.
 */
export const NON_CONTENT: { tags: string[]; classes: string[]; attributes: string[] } = {
	tags: ['aside', 'nav'],
	classes: ['heading-anchor'],
	attributes: ['data-pagefind-ignore'],
};

export function nonContentSelectors(): string[] {
	return [
		...NON_CONTENT.tags,
		...NON_CONTENT.classes.map((c) => `.${c}`),
		...NON_CONTENT.attributes.map((a) => `[${a}]`),
	];
}

/** hast names data-* attributes in camelCase: data-pagefind-ignore -> dataPagefindIgnore. */
const hastProperty = (attribute: string) =>
	attribute.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());

/**
 * Elements that never carry text for a reader of the twin, on top of
 * NON_CONTENT. Widget parts included: a <select> reaches hast-util-to-mdast as
 * its selected option and a checked <input> as a task-list item, so the skills
 * install picker arrived in every twin as "AgentAll (all)[x]Global".
 */
const DROP_TAGS = new Set([
	'script', 'style', 'svg', 'button', 'noscript', 'form', 'iframe', 'template',
	'select', 'option', 'input', 'label',
]);

/**
 * Tailwind classes that lay children out as a row. Such a parent separates its
 * children visually (gap-*), never with text, so once the boxes are gone the
 * labels arrive glued: "Skill-Based AssignmentService Catalog Authoring".
 */
const LAYOUT_ROW = new Set(['flex', 'inline-flex', 'grid', 'inline-grid']);

/** Concatenated text of a hast subtree. */
function textOf(node: any): string {
	if (node.type === 'text') return node.value ?? '';
	return (node.children ?? []).map(textOf).join('');
}

function classList(node: any): string[] {
	return ([] as string[]).concat((node.properties?.className as string[]) ?? []);
}

function isNonContent(node: any): boolean {
	if (DROP_TAGS.has(node.tagName) || NON_CONTENT.tags.includes(node.tagName)) return true;
	const classes = classList(node);
	if (NON_CONTENT.classes.some((c) => classes.includes(c))) return true;
	if (NON_CONTENT.attributes.some((a) => node.properties?.[hastProperty(a)] !== undefined)) {
		return true;
	}
	// Anything hidden from screen readers is decorative by definition, and the
	// same judgment applies to an agent reading the text.
	return node.properties?.ariaHidden === 'true' || node.properties?.ariaHidden === true;
}

/** Keep only <main>, minus everything that is not content. */
function contentRegion() {
	return (tree: any) => {
		let main: any;
		visit(tree, 'element', (node: any) => {
			if (!main && node.tagName === 'main') main = node;
		});
		if (main) tree.children = main.children;

		// HTML comments are not elements, so an element-only visitor lets them
		// through: "<!-- Hover Gradient Background -->" and Astro's own
		// "<!--astro:end-->" were showing up in twins.
		visit(tree, 'comment', (_node: any, index: number | undefined, parent: any) => {
			if (index === undefined || !parent) return;
			parent.children.splice(index, 1);
			return [SKIP, index];
		});

		visit(tree, 'element', (node: any, index: number | undefined, parent: any) => {
			if (index === undefined || !parent || !isNonContent(node)) return;
			parent.children.splice(index, 1);
			return [SKIP, index];
		});

		// Put the CSS-only boundaries back as real whitespace (see LAYOUT_ROW).
		visit(tree, 'element', (node: any) => {
			if (!classList(node).some((c) => LAYOUT_ROW.has(c))) return;
			const spaced: any[] = [];
			for (const child of node.children ?? []) {
				const before = spaced.length ? textOf(spaced[spaced.length - 1]) : '';
				const after = textOf(child);
				if (before !== '' && after !== '' && !/\s$/.test(before) && !/^\s/.test(after)) {
					spaced.push({ type: 'text', value: ' ' });
				}
				spaced.push(child);
			}
			node.children = spaced;
		});

		// An icon-only link is an empty shell once its svg is dropped, and prints
		// as "[](https://github.com/...)": noise that an agent may still follow.
		visit(tree, 'element', (node: any, index: number | undefined, parent: any) => {
			if (index === undefined || !parent || node.tagName !== 'a') return;
			if (textOf(node).trim() !== '') return;
			let hasImage = false;
			visit(node, 'element', (n: any) => {
				if (n.tagName === 'img') hasImage = true;
			});
			if (hasImage) return;
			parent.children.splice(index, 1);
			return [SKIP, index];
		});
	};
}

/* -------------------------------------------------------------------------- */
/* code                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * The language of a code block, from what the HTML already carries:
 *
 * - Shiki's <pre data-language="bash">: every fenced block in markdown and MDX.
 * - <pre class="mermaid">: diagrams, from remarkMermaid() in astro.config.mjs
 *   and renderSubsetHtml() in lib/models-extract.ts. The class is the diagram
 *   script's own contract, so it cannot be renamed without breaking the page.
 * - .command-text: the command box of Command.astro and SkillInstall.astro, a
 *   styled <code> or <textarea> rather than a <pre>. Inside a chat box
 *   (.command.is-chat) it is a prompt, otherwise a shell command. The class is
 *   also used by styles/components.css and SkillInstall's script; renaming it
 *   means updating this rule too, or those twins lose their code fences.
 */
function languageOf(node: any, parent: any): string | undefined {
	const shiki = node.properties?.dataLanguage;
	if (typeof shiki === 'string' && shiki !== '') return shiki;
	const classes = classList(node);
	if (node.tagName === 'pre' && classes.includes('mermaid')) return 'mermaid';
	if (classes.includes('command-text')) return classList(parent).includes('is-chat') ? 'text' : 'bash';
	return undefined;
}

/**
 * Code keeps its language: every element languageOf() recognizes becomes a
 * fenced block in that language. hast-util-to-mdast reads the language from a
 * "language-*" class on the <code> inside a <pre>.
 */
function codeBlocks() {
	return (tree: any) => {
		visit(tree, 'element', (node: any, index: number | undefined, parent: any) => {
			if (index === undefined || !parent) return;
			const lang = languageOf(node, parent);
			if (lang === undefined) return;

			const code =
				node.tagName === 'pre'
					? (node.children ?? []).find((c: any) => c.type === 'element' && c.tagName === 'code')
					: undefined;
			if (code) {
				code.properties = { ...code.properties, className: [`language-${lang}`] };
				return SKIP;
			}

			parent.children.splice(index, 1, {
				type: 'element',
				tagName: 'pre',
				properties: {},
				children: [
					{
						type: 'element',
						tagName: 'code',
						properties: { className: [`language-${lang}`] },
						children: [{ type: 'text', value: textOf(node).trim() }],
					},
				],
			});
			return [SKIP, index];
		});
	};
}

/* -------------------------------------------------------------------------- */
/* cards                                                                       */
/* -------------------------------------------------------------------------- */

const HEADING = /^h[1-6]$/;
const BLOCK_TAGS = new Set([
	'div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'dl', 'section', 'article',
	'header', 'footer', 'figure', 'blockquote', 'table', 'pre',
]);
/** Parents in which a link is part of running text, never a card. */
const INLINE_CONTEXT = new Set([
	'p', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'td', 'th', 'dt', 'dd', 'figcaption',
	'caption', 'summary', 'span', 'strong', 'em', 'b', 'i',
]);

const hasText = (node: any) => textOf(node).trim() !== '';

/** The card's text blocks, looking through single wrappers (<a><div>...</div></a>). */
function textBlocks(node: any): any[] {
	let current = node;
	for (;;) {
		const parts = (current.children ?? []).filter(
			(c: any) => (c.type === 'element' || c.type === 'text') && hasText(c),
		);
		const only = parts.length === 1 ? parts[0] : undefined;
		if (only?.type === 'element' && only.tagName !== 'p' && !HEADING.test(only.tagName)) {
			current = only;
			continue;
		}
		return parts;
	}
}

function wrapsBlocks(node: any): boolean {
	let found = false;
	visit(node, 'element', (n: any) => {
		if (n !== node && BLOCK_TAGS.has(n.tagName)) found = true;
	});
	return found;
}

const element = (tagName: string, children: any[], properties: any = {}) => ({
	type: 'element',
	tagName,
	properties,
	children,
});

/**
 * A card is a link around a whole block: a title, a description, perhaps a
 * date. Converted as is it becomes one long label ("[Data Catalog The core of
 * Semantius ...](...)") or one link per line. Here the link moves onto the
 * card's heading (or its first text block when it has none) and the rest stays
 * as plain paragraphs.
 *
 * Structural, so every card on every page is covered without naming one. A
 * link is a card when it wraps block elements, or when it stands on its own
 * (not inside a paragraph, list item, heading or table cell) and holds more
 * than one text block. A link in running text is neither.
 */
function cardLinks() {
	return (tree: any) => {
		visit(tree, 'element', (node: any, index: number | undefined, parent: any) => {
			if (node.tagName !== 'a' || index === undefined || !parent) return;
			const blocks = textBlocks(node);
			// An image-only link (a logo) has no text to move a link onto.
			if (blocks.length === 0) return;
			const standalone = parent.type === 'root' || !INLINE_CONTEXT.has(parent.tagName);
			if (!(wrapsBlocks(node) || (standalone && blocks.length > 1))) return;

			const href = node.properties?.href;
			const headingAt = blocks.findIndex((b) => b.type === 'element' && HEADING.test(b.tagName));
			const titleAt = headingAt === -1 ? 0 : headingAt;
			const link = (children: any[]) => element('a', children, { href });

			const replacement = blocks.map((b, i) => {
				const ownsText = b.type === 'element' && (b.tagName === 'p' || HEADING.test(b.tagName));
				if (i === titleAt) {
					return ownsText
						? { ...b, children: [link(b.children)] }
						: element('p', [link(b.type === 'text' ? [b] : b.children)]);
				}
				// Inline pieces get a paragraph of their own, or adjacent ones run
				// together: "Data CatalogThe core of Semantius".
				return b.type === 'element' && BLOCK_TAGS.has(b.tagName) ? b : element('p', [b]);
			});

			parent.children.splice(index, 1, ...replacement);
			return [SKIP, index + replacement.length];
		});
	};
}

/* -------------------------------------------------------------------------- */
/* links                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Make internal links absolute and point them at the twin.
 *
 * A twin is read in isolation, often with no memory of where it came from, so a
 * relative "/docs/cli" is unusable. Rewriting it to
 * "https://www.semantius.com/docs/cli.md" keeps an agent inside markdown as it
 * follows links. Fragments are kept. Files (/logo.png, /a.md) only become
 * absolute.
 */
function linkTargets(siteUrl: string) {
	return (tree: any) => {
		visit(tree, (node: any, index: number | undefined, parent: any) => {
			// `image` included: a relative asset URL is useless in a document whose
			// whole premise is being readable in isolation.
			if (node.type !== 'link' && node.type !== 'definition' && node.type !== 'image') return;
			const url: string = node.url ?? '';

			// "#" is a placeholder the page uses for a control, not a destination.
			// Left alone it ships as "[Contact Sales](#)": a link to nowhere that an
			// agent may still follow. Keep the label, drop the link.
			if (node.type === 'link' && (url === '' || url === '#')) {
				if (index === undefined || !parent) return;
				parent.children.splice(index, 1, ...(node.children ?? []));
				return [SKIP, index];
			}

			if (!url.startsWith('/') || url.startsWith('//')) return;
			const hashAt = url.indexOf('#');
			const path = hashAt === -1 ? url : url.slice(0, hashAt);
			const hash = hashAt === -1 ? '' : url.slice(hashAt);
			node.url =
				(isPagePath(path) ? twinUrl(path, siteUrl) : new URL(path, siteUrl).toString()) + hash;
		});
	};
}

/* -------------------------------------------------------------------------- */

const processors = new Map<string, any>();
function processorFor(siteUrl: string) {
	let processor = processors.get(siteUrl);
	if (!processor) {
		processor = unified()
			.use(rehypeParse, { fragment: false })
			.use(contentRegion)
			.use(codeBlocks)
			.use(cardLinks)
			.use(rehypeRemark)
			.use(remarkGfm)
			.use(linkTargets, siteUrl)
			.use(remarkStringify, STRINGIFY_OPTIONS);
		processors.set(siteUrl, processor);
	}
	return processor;
}

/** The markdown body of a twin: the page's content region, converted. */
export function htmlToMarkdown(html: string, siteUrl: string): string {
	return collapseBlankLines(String(processorFor(siteUrl).processSync(html)));
}

/* -------------------------------------------------------------------------- */
/* page facts for the header and footer                                        */
/* -------------------------------------------------------------------------- */

export interface PageFacts {
	/** <title>, without the site name around it. */
	title?: string;
	/** <meta name="description">. */
	description?: string;
	/** The page's JSON-LD BreadcrumbList names, outermost first. Empty when it has none. */
	trail: string[];
	/** The page's rel="prev" and rel="next" links, for the twin's "Related" footer. */
	related: Array<{ title: string; path: string }>;
}

function breadcrumbNames(json: unknown): string[] | undefined {
	const nodes = Array.isArray(json) ? json : [json, ...(((json as any)?.['@graph'] as unknown[]) ?? [])];
	for (const node of nodes) {
		if ((node as any)?.['@type'] !== 'BreadcrumbList') continue;
		return [...((node as any).itemListElement ?? [])]
			.sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
			.map((item: any) => String(item.name ?? '').trim())
			.filter(Boolean);
	}
	return undefined;
}

/**
 * What the header and footer need, read from the page rather than computed a
 * second time: the same title, description and breadcrumb the page publishes
 * to browsers and search engines.
 */
export function pageFacts(html: string): PageFacts {
	const tree = unified().use(rehypeParse, { fragment: false }).parse(html);
	const facts: PageFacts = { trail: [], related: [] };

	visit(tree, 'element', (node: any) => {
		if (node.tagName === 'title' && facts.title === undefined) {
			// "Thing - Semantius Agentic Data Platform" and "Semantius | The ...":
			// the site name is browser-tab chrome and blurs what the page is about.
			facts.title = textOf(node)
				.replace(/\s*[-|]\s*Semantius.*$/, '')
				.replace(/^Semantius\s*[-|]\s*/, '')
				.trim();
		}
		if (node.tagName === 'meta' && node.properties?.name === 'description') {
			facts.description ??= String(node.properties.content ?? '').trim() || undefined;
		}
		if (node.tagName === 'script' && node.properties?.type === 'application/ld+json' && !facts.trail.length) {
			try {
				facts.trail = breadcrumbNames(JSON.parse(textOf(node))) ?? [];
			} catch {
				// Not ours to validate; a page without a readable trail gets none.
			}
		}
		// The page's previous and next pages. These links sit in navigation,
		// which the body leaves out, so they are read here from the whole page.
		// The label is what the link shows, "Previous" and the page title as
		// separate pieces of text, joined: "Previous: Modules".
		const rel = ([] as string[]).concat(node.properties?.rel ?? []);
		if (
			node.tagName === 'a' &&
			(rel.includes('prev') || rel.includes('next')) &&
			typeof node.properties.href === 'string'
		) {
			const label = (node.children ?? [])
				.map((c: any) => textOf(c).trim())
				.filter(Boolean)
				.join(': ');
			facts.related.push({ title: label || textOf(node).trim(), path: node.properties.href });
		}
	});
	return facts;
}
