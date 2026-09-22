/**
 * Adapted from dualmark (Apache-2.0): packages/core/src/text.ts
 * See ./NOTICE. Modified: trimmed the currency table to what we emit, split
 * out collapseBlankLines, and joinLines now keeps empty strings.
 *
 * IMPORTANT: normalizeUnicode is for strings WE compose (titles, descriptions,
 * metadata lines), never for verbatim content bodies. Blueprint bodies carry
 * mermaid fences where `-->` and `->` are syntax, and code fences where a
 * glyph may be load-bearing. Rewriting those would corrupt them.
 */

/**
 * Fold typographic characters down to ASCII so agents see plain text.
 *
 * Written with \u escapes rather than literal characters on purpose: these are
 * exactly the codepoints that get mangled by an editor, a locale or a diff
 * tool, and a silently corrupted replacement table fails without any error.
 *
 * Note the em dash maps to "--" and the en dash to "-", which also happens to
 * match the project rule against using either as punctuation.
 */
export function normalizeUnicode(text: string): string {
	return text
		// zero-width space, ZWNJ, ZWJ, BOM
		.replace(/[​‌‍﻿]/g, '')
		// variation selector-16 (emoji presentation), soft hyphen
		.replace(/️/g, '')
		.replace(/­/g, '')
		// non-breaking, hair and narrow no-break spaces
		.replace(/[   ]/g, ' ')
		// hyphen, non-breaking hyphen
		.replace(/[‐‑]/g, '-')
		// single quotes and apostrophe variants
		.replace(/[‘’‚ʼʻ]/g, "'")
		// double quotes and guillemets
		.replace(/[“”„«»]/g, '"')
		// en dash, em dash, ellipsis
		.replace(/–/g, '-')
		.replace(/—/g, '--')
		.replace(/…/g, '...')
		// bullet, middle dot
		.replace(/[•·]/g, '-')
		// arrows
		.replace(/→/g, '->')
		.replace(/←/g, '<-')
		// multiplication sign, approx, greater-or-equal
		.replace(/×/g, 'x')
		.replace(/≈/g, '~=')
		.replace(/≥/g, '>=')
		// currency symbols we actually use
		.replace(/€/g, 'EUR ')
		.replace(/£/g, 'GBP ');
}

/** Collapse runs of 3+ blank lines and trim. Safe on verbatim bodies. */
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

/** ISO date only, no time. Undefined-safe so converters can pass optionals. */
export function fmtDate(d: Date | string | undefined): string | undefined {
	if (!d) return undefined;
	const date = typeof d === 'string' ? new Date(d) : d;
	if (Number.isNaN(date.getTime())) return undefined;
	return date.toISOString().slice(0, 10);
}

export function slugToTitle(slug: string): string {
	return slug
		.split(/[-/]/)
		.filter(Boolean)
		.map((w) => (w[0] ? w[0].toUpperCase() + w.slice(1) : w))
		.join(' ');
}
