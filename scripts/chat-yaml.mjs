/**
 * Writes a /botsim chat (a list of { from, text, calls? } messages) as YAML
 * that is easy to edit by hand: no line is longer than about 80 characters.
 *
 * - A short text stays on one line, quoted only when YAML needs it.
 * - A long text on one line becomes a folded block (`>-`). YAML joins its
 *   lines with spaces again, so the value is exactly the original line.
 * - A text with line breaks becomes a literal block (`|-`), line by line. An
 *   agent reply is markdown, so its long paragraph and list lines are wrapped
 *   too: markdown reads a line break inside a paragraph as a space, so the
 *   reply renders the same. Tables, headings, code and HTML lines are never
 *   wrapped, and a line is never broken where the next line would start a
 *   list, quote, heading or table.
 * - Anything a block cannot hold exactly (leading or trailing whitespace,
 *   control characters) falls back to a double-quoted string.
 *
 * No YAML library is needed to write this; apps/web parses it with `yaml`.
 */

const WIDTH = 80;

/** One-line strings that YAML reads back unchanged without quotes. */
const PLAIN = /^[A-Za-z][A-Za-z0-9 _,.'()/&+%!?;-]*$/;
const RESERVED = /^(?:true|false|null|yes|no|on|off|y|n)$/i;

/** Breaks a line into words at single spaces only, so no space is ever lost. */
const words = (line) => line.split(/(?<=\S) (?=\S)/);

/** Words a wrapped line must not start with: markdown would read them as a new block. */
const RISKY_START = /^(?:[-+*>#|=`~<]|\d+[.)]$)/;

/** Greedy fill of `tokens` into lines of at most `width`, the first after `first`, the rest after `rest`. */
function fill(tokens, width, first = '', rest = '', avoid = null) {
	const lines = [];
	let line = first;
	let empty = true;
	for (const token of tokens) {
		if (empty) {
			line += token;
			empty = false;
		} else if (line.length + 1 + token.length <= width || (avoid && avoid.test(token))) {
			line += ' ' + token;
		} else {
			lines.push(line);
			line = rest + token;
		}
	}
	lines.push(line);
	return lines;
}

/** Wraps a markdown text's long paragraph and list lines without changing how it renders. */
function wrapMarkdown(text, width) {
	const out = [];
	let fenced = false;
	for (const line of text.split('\n')) {
		if (/^\s*(?:```|~~~)/.test(line)) fenced = !fenced;
		const keep =
			fenced ||
			line.length <= width ||
			line.includes('|') ||
			/^\s*(?:```|~~~|#|<)/.test(line) ||
			/^ {4}|^\t/.test(line) ||
			/^\s*([-*_=])(?:\s*\1){2,}\s*$/.test(line);
		if (keep) {
			out.push(line);
			continue;
		}
		// The prefix every line of this block starts with: indentation, quote
		// markers, then the list marker on the first line and spaces of the same
		// width on the others, so wrapped lines stay inside the list item.
		const [prefix] = line.match(/^\s*(?:>\s*)*(?:(?:[-*+]|\d+[.)])\s+)?/);
		const rest = prefix.replace(/(?:[-*+]|\d+[.)])(\s+)$/, (marker) => ' '.repeat(marker.length));
		out.push(...fill(words(line.slice(prefix.length)), width, prefix, rest, RISKY_START));
	}
	return out;
}

/** The value of `key:` at `indent` spaces, as YAML: on the same line, or a block below it. */
function scalar(text, indent, markdown) {
	const pad = ' '.repeat(indent + 2);
	const width = WIDTH - pad.length;
	const unsafe = /^\s|\s$|[\r\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text);
	if (text === '' || unsafe) return JSON.stringify(text);
	if (text.includes('\n')) {
		// A block takes its indentation from its first line, so that line cannot
		// start with whitespace, and a line of only spaces is ambiguous.
		const firstLine = text.split('\n').find((line) => line.trim()) ?? '';
		if (/^\s/.test(firstLine) || /^[ \t]+$/m.test(text)) return JSON.stringify(text);
		const lines = markdown ? wrapMarkdown(text, width) : text.split('\n');
		return '|-\n' + lines.map((line) => (line ? pad + line : '')).join('\n');
	}
	const oneLine = PLAIN.test(text) && !RESERVED.test(text) ? text : JSON.stringify(text);
	if (indent + 'text: '.length + oneLine.length <= WIDTH) return oneLine;
	return '>-\n' + fill(words(text), width).map((line) => pad + line).join('\n');
}

/** A chat as a YAML document. */
export function chatToYaml(messages) {
	const out = [];
	for (const message of messages) {
		out.push(`- from: ${message.from}`);
		out.push(`  text: ${scalar(message.text, 2, message.from === 'bot')}`);
		if (message.calls) {
			out.push('  calls:');
			for (const call of message.calls) {
				const lead = call.tool ? `    - tool: ${scalar(call.tool, 6, false)}\n      ` : '    - ';
				out.push(`${lead}text: ${scalar(call.text, 6, false)}`);
			}
		}
	}
	return out.length ? `${out.join('\n')}\n` : '[]\n';
}
