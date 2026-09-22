/**
 * The single seam between "a page's source" and "markdown for agents".
 *
 * All three branches are AST based. `markdown` and `mdx` read collection
 * source; `html` reads the page's own rendered output and is the fallback that
 * makes the no-work guarantee hold (any new page gets a twin with no per-page
 * work). Keep every caller on this signature.
 *
 * The branch is chosen by FILE EXTENSION, not by collection. Both the blog and
 * docs globs accept `{md,mdx}`, so a future MDX blog post reaches the mdx
 * branch without anyone remembering to wire it.
 *
 * This module runs in Node only: the mdx branch pulls in acorn via remark-mdx,
 * and the html branch parses rendered output that only exists after the build.
 * Callers reach it from the content loaders and from astro:build:done, never
 * from a prerendered route (which the Cloudflare adapter bundles into workerd).
 */
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMdx from 'remark-mdx';
import remarkGfm from 'remark-gfm';
import remarkStringify from 'remark-stringify';
import rehypeParse from 'rehype-parse';
import rehypeRemark from 'rehype-remark';
import { visit, SKIP } from 'unist-util-visit';
import { collapseBlankLines } from './text';
import { toMarkdownPath } from './paths';
import { hasMarkdownTwin } from './excluded';

export interface SourceOptions {
	/** Absolute site origin, e.g. "https://www.semantius.com". Used to make
	 *  internal links absolute so a twin read in isolation is still navigable. */
	siteUrl: string;
}

export type PageSource =
	| { kind: 'markdown'; text: string }
	| { kind: 'mdx'; text: string }
	| { kind: 'html'; text: string };

export function sourceKindFor(filePath: string): 'markdown' | 'mdx' {
	return filePath.endsWith('.mdx') ? 'mdx' : 'markdown';
}

const STRINGIFY_OPTIONS = {
	bullet: '-' as const,
	emphasis: '_' as const,
	fences: true,
	rule: '-' as const,
	// remark-stringify does not hard-wrap by default in v11, which is what we
	// want: hard-wrapped markdown chunks badly when an agent splits it.
};

/* -------------------------------------------------------------------------- */
/* mdx                                                                         */
/* -------------------------------------------------------------------------- */

/** Text of the first attribute matching `name` on an MDX JSX node. */
function attr(node: any, name: string): string | undefined {
	for (const a of node.attributes ?? []) {
		if (a.type === 'mdxJsxAttribute' && a.name === name && typeof a.value === 'string') {
			return a.value;
		}
	}
	return undefined;
}

function codeNode(value: string, lang: string) {
	return { type: 'code', lang, value };
}

/**
 * Strip ESM imports and rewrite the four components our docs actually use.
 * Counted across all 19 .mdx files: Command 29, SkillInstall 2, Image 2,
 * ModelList 1. Anything else capitalised is unwrapped, keeping its children.
 *
 * This is an AST walk rather than regex specifically because regex is wrong
 * here: docs/cli/command.mdx has `semantius call crud create_field <<EOF`
 * inside a bash fence, and a tag-stripping regex mangles that heredoc. The
 * visitor never enters `code` nodes, so it cannot.
 */
function rewriteMdx() {
	return (tree: any) => {
		visit(tree, (node: any, index: number | undefined, parent: any) => {
			if (index === undefined || !parent) return;

			// import / export statements
			if (node.type === 'mdxjsEsm') {
				parent.children.splice(index, 1);
				return [SKIP, index];
			}

			if (node.type !== 'mdxJsxFlowElement' && node.type !== 'mdxJsxTextElement') return;

			const name: string = node.name ?? '';

			if (name === 'Command') {
				const command = attr(node, 'command');
				if (command) {
					// mode="chat" renders a chat prompt, not a shell command.
					const lang = attr(node, 'mode') === 'chat' ? 'text' : 'bash';
					parent.children.splice(index, 1, codeNode(command, lang));
					return [SKIP, index];
				}
			}

			if (name === 'SkillInstall') {
				const url = attr(node, 'url');
				if (url) {
					const flags = attr(node, 'includeSubagents') !== undefined ? ' --all' : '';
					parent.children.splice(
						index,
						1,
						codeNode(`npx skills add https://github.com/${url}${flags} --global`, 'bash'),
					);
					return [SKIP, index];
				}
			}

			if (name === 'Image') {
				// The real src is content-hashed at build time and is not derivable
				// from source, so keep the alt text and drop the reference.
				const alt = attr(node, 'alt') ?? '';
				parent.children.splice(index, 1, { type: 'paragraph', children: [{ type: 'text', value: alt }] });
				return [SKIP, index];
			}

			// Any other component: unwrap, keeping children. Covers <ModelList/>
			// (which renders to nothing here) and anything added later.
			parent.children.splice(index, 1, ...(node.children ?? []));
			return [SKIP, index];
		});
	};
}

/* -------------------------------------------------------------------------- */
/* html                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Boilerplate removal, reusing the contract this repo already declares for
 * Pagefind. `<main data-pagefind-body>` in Layout.astro marks the content and
 * astro.config.mjs lists the chrome. One definition of "what is content on this
 * page" serves both the search index and the agent twins: mark a new region
 * data-pagefind-ignore and both improve together.
 */
const DROP_TAGS = new Set([
	'script', 'style', 'svg', 'button', 'noscript', 'form', 'iframe', 'nav', 'aside', 'template',
]);
// Mirrors pagefindIndex()'s excludeSelectors in astro.config.mjs.
const DROP_CLASS = /(^|\s)heading-anchor(\s|$)/;

function mainContentOnly() {
	return (tree: any) => {
		let main: any;
		visit(tree, 'element', (node: any) => {
			if (!main && node.tagName === 'main') main = node;
		});
		if (main) tree.children = main.children;

		// HTML comments are not elements, so an element-only visitor lets them
		// through into the markdown: "<!-- Hover Gradient Background -->" and
		// Astro's own "<!--astro:end-->" were showing up in twins.
		visit(tree, 'comment', (_node: any, index: number | undefined, parent: any) => {
			if (index === undefined || !parent) return;
			parent.children.splice(index, 1);
			return [SKIP, index];
		});

		visit(tree, 'element', (node: any, index: number | undefined, parent: any) => {
			if (index === undefined || !parent) return;
			const classes = ([] as string[]).concat((node.properties?.className as string[]) ?? []).join(' ');
			const drop =
				DROP_TAGS.has(node.tagName) ||
				node.properties?.dataPagefindIgnore !== undefined ||
				// Anything hidden from screen readers is decorative by definition,
				// and the same judgement applies to an agent reading the text.
				node.properties?.ariaHidden === 'true' ||
				node.properties?.ariaHidden === true ||
				DROP_CLASS.test(classes);
			if (drop) {
				parent.children.splice(index, 1);
				return [SKIP, index];
			}
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
 * relative "/docs/cli" is unusable. Rewriting to
 * "https://www.semantius.com/docs/cli.md" keeps an agent inside markdown as it
 * follows links, which is the whole point of the related-links footer too.
 *
 * Fragments are preserved and reattached after the .md suffix. Links to pages
 * with no twin (the 404, the pagination stubs) stay as HTML URLs.
 */
function absolutiseLinks(siteUrl: string) {
	return (tree: any) => {
		visit(tree, (node: any) => {
			// `image` included: a relative asset URL is useless in a document whose
			// whole premise is being readable in isolation.
			if (node.type !== 'link' && node.type !== 'definition' && node.type !== 'image') return;
			const url: string = node.url ?? '';
			if (!url.startsWith('/') || url.startsWith('//')) return;

			const hashAt = url.indexOf('#');
			const path = hashAt === -1 ? url : url.slice(0, hashAt);
			const hash = hashAt === -1 ? '' : url.slice(hashAt);

			// Leave real assets alone: they have no twin and no markdown form.
			if (/\.[a-z0-9]{2,4}$/i.test(path) && !path.endsWith('.md')) {
				node.url = new URL(path, siteUrl).toString() + hash;
				return;
			}

			const target = hasMarkdownTwin(path) ? toMarkdownPath(path) : path;
			node.url = new URL(target, siteUrl).toString() + hash;
		});
	};
}

/* -------------------------------------------------------------------------- */

function buildMdx(siteUrl: string) {
	return unified()
		.use(remarkParse)
		.use(remarkMdx)
		.use(remarkGfm)
		.use(rewriteMdx)
		.use(absolutiseLinks, siteUrl)
		.use(remarkStringify, STRINGIFY_OPTIONS);
}

function buildMarkdown(siteUrl: string) {
	return unified()
		.use(remarkParse)
		.use(remarkGfm)
		.use(absolutiseLinks, siteUrl)
		.use(remarkStringify, STRINGIFY_OPTIONS);
}

function buildHtml(siteUrl: string) {
	return unified()
		.use(rehypeParse, { fragment: false })
		.use(mainContentOnly)
		.use(rehypeRemark)
		.use(remarkGfm)
		.use(absolutiseLinks, siteUrl)
		.use(remarkStringify, STRINGIFY_OPTIONS);
}

// Processors are stateless once built, so cache one set per site origin.
const cache = new Map<string, Record<PageSource['kind'], any>>();
function processorsFor(siteUrl: string) {
	let set = cache.get(siteUrl);
	if (!set) {
		set = { mdx: buildMdx(siteUrl), markdown: buildMarkdown(siteUrl), html: buildHtml(siteUrl) };
		cache.set(siteUrl, set);
	}
	return set;
}

/** Convert a page's source to the markdown body of its twin. */
export function sourceToMarkdown(src: PageSource, options: SourceOptions): string {
	const processor = processorsFor(options.siteUrl)[src.kind];
	return collapseBlankLines(String(processor.processSync(src.text)));
}
