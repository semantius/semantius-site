/**
 * The visible placeholder for a pricing figure that is not confirmed yet.
 *
 * A string rather than only a component, because FAQ answers are HTML strings
 * and need the identical markup. `data-tbd` names what is pending, so
 * `grep data-tbd` over the built page lists every open item, and FAQ.astro
 * uses it to keep a placeholder out of the FAQPage JSON-LD.
 */

const CLASS =
	'inline-flex items-center rounded-md border border-dashed border-amber-600/60 bg-amber-500/10 px-1.5 py-px align-middle text-[0.75em] font-semibold uppercase tracking-wide text-amber-700 dark:border-amber-400/60 dark:text-amber-300';

const escapeAttr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

export function tbdHtml(note: string): string {
	const n = escapeAttr(note);
	return `<span class="${CLASS}" data-tbd="${n}" title="To be confirmed: ${n}">TBD</span>`;
}
