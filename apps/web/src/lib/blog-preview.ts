/**
 * What a blog card shows in the space a hero image would take.
 *
 * A post without a heroImage gets a text-only card, filled from the post
 * itself: its section headings when it has at least MIN_HEADINGS of them at
 * its top heading level, otherwise its opening paragraphs. A short list of
 * headings leaves the card half empty, which is why fewer than MIN_HEADINGS
 * fall back to the paragraphs, which always have text to show.
 *
 * The headings come from Astro's own render of the post, so each one's id is
 * the anchor the post page really has and the card can deep link to it. The
 * opening paragraphs are read from the markdown source with the remark parser
 * Astro uses, so the card shows the text a reader sees, without markdown
 * syntax. Only top-level paragraphs count: list items and block quotes read
 * oddly when run together as prose.
 */
import { render, type CollectionEntry } from 'astro:content';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMdx from 'remark-mdx';

const MIN_HEADINGS = 5;

/**
 * The card fades the text out where it ends, so this only caps how much
 * text goes into the page. It is comfortably more than any card height shows.
 */
const EXCERPT_CHARS = 700;

export type PostPreview =
	| { kind: 'headings'; headings: { text: string; id: string }[] }
	| { kind: 'excerpt'; paragraphs: string[] };

interface MdNode {
	type: string;
	value?: string;
	children?: MdNode[];
}

/**
 * The visible text of a node. Images, raw HTML and MDX expressions have no
 * visible text of their own, so they contribute nothing.
 */
function plainText(node: MdNode): string {
	if (node.type === 'text' || node.type === 'inlineCode') return node.value ?? '';
	if (node.type === 'break') return ' ';
	return node.children?.map(plainText).join('') ?? '';
}

function clean(text: string): string {
	return text.replace(/\s+/g, ' ').trim();
}

/** Undefined for a post with a heroImage: its card shows the picture instead. */
export async function getPostPreview(post: CollectionEntry<'blog'>): Promise<PostPreview | undefined> {
	if (post.data.heroImage) return undefined;

	const { headings } = await render(post);
	if (headings.length > 0) {
		const top = Math.min(...headings.map((h) => h.depth));
		const listed = headings
			.filter((h) => h.depth === top)
			.map((h) => ({ text: clean(h.text), id: h.slug }))
			.filter((h) => h.text && h.id);
		if (listed.length >= MIN_HEADINGS) return { kind: 'headings', headings: listed };
	}

	const parser = unified().use(remarkParse).use(remarkGfm);
	if (post.filePath?.endsWith('.mdx')) parser.use(remarkMdx);
	const nodes = parser.parse(post.body ?? '').children as MdNode[];

	const paragraphs: string[] = [];
	let length = 0;
	for (const node of nodes) {
		if (node.type !== 'paragraph') continue;
		const text = clean(plainText(node));
		if (!text) continue;
		paragraphs.push(text);
		length += text.length;
		if (length >= EXCERPT_CHARS) break;
	}
	return { kind: 'excerpt', paragraphs };
}
