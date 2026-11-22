/**
 * Adapted from dualmark (Apache-2.0): packages/core/src/text.ts
 * See ./NOTICE. Modified: kept only joinLines, which now keeps empty strings,
 * and collapseBlankLines, split out of cleanBody.
 *
 * Twins keep the page's own characters (typographic quotes, dashes, arrows):
 * they are served as UTF-8 (public/_headers), and folding them to ASCII would
 * also rewrite code and mermaid fences, where `-->` is syntax.
 */

/** Collapse runs of 3+ blank lines and trim. */
export function collapseBlankLines(text: string): string {
	return text.replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * Join lines, dropping only null/undefined/false.
 *
 * Empty strings are KEPT, because they are how callers ask for a blank line and
 * markdown is whitespace significant. Dropping them runs a thematic break into
 * the paragraph after it, and turns the line before a `---` into a setext
 * heading, which silently eats content.
 */
export function joinLines(...parts: Array<string | false | null | undefined>): string {
	return parts
		.filter((x): x is string => x !== null && x !== undefined && x !== false)
		.join('\n');
}
