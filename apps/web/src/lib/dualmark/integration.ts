/**
 * Tier B, the universal fallback, plus the coverage report.
 *
 * Runs in astro:build:done, which is the only place the rendered HTML exists
 * and which executes in NODE under every adapter (the workerd constraint
 * applies to prerendered route modules, not to integration hooks). That is why
 * Tier B cannot live in the .md route: a getStaticPaths route runs before any
 * HTML has been written.
 *
 * Division of labor with the route writer:
 *   route  -> Tier A (content collections) and Tier C (overrides)
 *   here   -> Tier B (extraction) for every page the route did not claim
 *
 * "Did not claim" is decided by whether the .md file was written during THIS
 * build (mtime against build start), which needs no coordination between the
 * two writers and does not mistake a stale file for a fresh one.
 *
 * How it decides what is content: it reuses the contract this repo already
 * declares for Pagefind. `<main data-pagefind-body>` in Layout.astro marks the
 * content region and astro.config.mjs lists the chrome to drop. One definition
 * serves both the search index and the agent twins, so marking a new decorative
 * region data-pagefind-ignore improves both at once. This is the same thing a
 * search engine does when it extracts plain text, except we do not have to
 * guess: we already declared the answer.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sourceToMarkdown } from './source';
import { docHeader, docFooter } from './compose';
import { toMarkdownPath } from './paths';
import { hasMarkdownTwin } from './excluded';
import { canonicalUrl, trailFromPath } from './nav';

/** Twins below this are almost certainly a bug or a page worth overriding. */
const SIZE_FLOOR_BYTES = 200;

function textBetween(html: string, re: RegExp, group = 1): string | undefined {
	const m = html.match(re);
	return m?.[group]?.trim() || undefined;
}

function decodeEntities(s: string): string {
	return s
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'");
}

/** "about/index.html" -> "/about"; "index.html" -> "/" */
function pathnameFor(pathnameFromAstro: string): string {
	const p = `/${pathnameFromAstro}`.replace(/\/+/g, '/');
	return p === '/' ? '/' : p.replace(/\/$/, '');
}

/** `<img>` tags inside the page's content region, alt text plus absolute src. */
function contentImages(html: string, siteUrl: string): Array<{ alt: string; src: string }> {
	// Restricted to <main> so the header logo and other chrome cannot match.
	const main = html.match(/<main[\s\S]*?<\/main>/i)?.[0] ?? html;
	const out: Array<{ alt: string; src: string }> = [];
	for (const tag of main.matchAll(/<img\b[^>]*>/gi)) {
		// Quote-aware: capture the opening quote and close on it. A ["'] class at
		// both ends truncates at an apostrophe inside a double-quoted attribute,
		// which silently lost the hero whose alt is "The Build Trap: Why 'Vibe
		// Coding' is ...". Exactly the bug this file had in its description regex.
		const src = tag[0].match(/\ssrc=(["'])(.*?)\1/i)?.[2];
		const alt = decodeEntities(tag[0].match(/\salt=(["'])(.*?)\1/i)?.[2] ?? '').trim();
		if (!src || !alt) continue;
		out.push({ alt, src: /^https?:\/\//.test(src) ? src : new URL(src, siteUrl).toString() });
	}
	return out;
}

/**
 * Put the images back into a twin the route wrote from source.
 *
 * A source-derived twin cannot name an image: `<Image>` resolves to a
 * content-hashed /_astro/ URL that does not exist yet when the content loader
 * runs, so source.ts emits the alt text on its own. By the time this hook runs
 * the page's HTML exists, so the reference is recoverable — and hiding a
 * screenshot from the agents the twins are written for defeats the point.
 *
 * The alt text is the join key because it is the one string the author wrote on
 * both sides. Deliberately conservative: a line is rewritten ONLY when the whole
 * line equals that alt text, and each image is spent once. A miss leaves the
 * twin byte-for-byte as it was, so this can only add information, never garble
 * a page.
 */
function restoreImages(
	markdown: string,
	html: string,
	siteUrl: string,
): { text: string; restored: number; dropped: string[] } {
	const images = contentImages(html, siteUrl);
	if (!images.length) return { text: markdown, restored: 0, dropped: [] };

	const lines = markdown.split('\n');
	const dropped: string[] = [];
	let restored = 0;

	for (const { alt, src } of images) {
		// A Tier C override may already carry the image; leave it alone.
		if (markdown.includes(`](${src})`)) continue;
		const i = lines.findIndex((line) => line.trim() === alt);
		if (i === -1) {
			// A listing page shows a thumbnail per card. If the twin already links
			// to that item by name, the picture is decoration for a destination the
			// reader can reach, not content the twin dropped.
			if (!markdown.includes(`[${alt}](`)) {
				dropped.push(alt.length > 48 ? `${alt.slice(0, 48)}…` : alt);
			}
			continue;
		}
		// Brackets in alt text would terminate the link label early.
		lines[i] = `![${alt.replace(/([[\]])/g, '\\$1')}](${src})`;
		restored++;
	}

	return { text: lines.join('\n'), restored, dropped };
}

/**
 * The invariant this pipeline never had: a twin must say what its page says.
 *
 * Tier B twins satisfy it trivially - they ARE the extraction. Tier A twins are
 * rendered from source by a second implementation, so they drift the moment a
 * component computes something the source does not spell out. Every guard above
 * this one was added after a specific incident (thin twins, a leaked dev
 * origin); none of them could see a twin that quietly said something else than
 * the page, which is how a wrong install command, a promise of 56 models with
 * none listed, and every screenshot on the site shipped unnoticed.
 *
 * Compares sentences rather than words so a reworded line is not reported as a
 * loss, and normalizes markdown punctuation so "**Bold**" matches "Bold".
 * Warning, never an error: some divergence is deliberate (dropped forms and
 * buttons), and a release must not hinge on a heuristic.
 */
function normalizeForCompare(text: string): string {
	return text
		// The page keeps smart typography; Tier A twin bodies are ASCII-folded by
		// text.ts. Comparing them without folding reported every sentence holding
		// an apostrophe as missing content: 202 false positives on the first run.
		.replace(/[\u2018\u2019\u201B]/g, "'")
		.replace(/[\u201C\u201D]/g, '"')
		.replace(/[\u2013\u2014]/g, '-')
		.replace(/\u2026/g, '...')
		.replace(/[`*_~]/g, '')
		.replace(/[\[\]]/g, '')
		.replace(/[\s]+/g, ' ')
		.trim()
		.toLowerCase();
}

function missingFromTwin(pageMarkdown: string, twin: string): string[] {
	const haystack = normalizeForCompare(twin);
	const seen = new Set<string>();
	const missing: string[] = [];

	let fenced = false;
	for (const block of pageMarkdown.split(/\n+/)) {
		const trimmed = block.trim();
		if (trimmed.startsWith('```')) fenced = !fenced;
		// Code is reformatted by the round trip, table rows differ by padding
		// alone, and a line that is only a link is navigation. None of the three
		// can be compared as prose, and all three drown the real signal: the first
		// run of this guard reported 8485 differences, overwhelmingly these.
		if (fenced || trimmed.startsWith('```') || trimmed.startsWith('|')) continue;
		if (/^[-*]?\s*\[[^\]]*\]\([^)]*\)$/.test(trimmed)) continue;

		for (const sentence of block.split(/(?<=[.:!?])\s+/)) {
			const needle = normalizeForCompare(sentence);
			// Short fragments are labels, dates and button text: too noisy to be
			// evidence of anything, and too likely to collide by accident.
			if (needle.length < 40 || needle.split(' ').length < 6 || seen.has(needle)) continue;
			seen.add(needle);
			if (!haystack.includes(needle)) missing.push(sentence.trim());
		}
	}
	return missing;
}

export function markdownTwins() {
	let clientDir: string | undefined;
	let siteFromConfig: string | undefined;
	let buildStart = 0;

	return {
		name: 'markdown-twins',
		hooks: {
			'astro:config:setup': ({ config }: any) => {
				if (config.adapter) clientDir = fileURLToPath(config.build.client);
				// Take the origin from the RESOLVED Astro config, never from
				// process.env: Vite merges apps/web/.env (SITE_URL=localhost:4321)
				// into process.env after astro.config.mjs is evaluated, so reading it
				// later bakes the dev URL into production output.
				if (config.site) siteFromConfig = String(config.site).replace(/\/+$/, '');
			},
			'astro:build:start': () => {
				// Used to tell a twin the route writer just emitted from a stale one
				// left by a previous build. Without this, a build over a non-empty
				// dist skips extraction entirely and silently reports every page as
				// source-derived.
				buildStart = Date.now();
			},

			'astro:build:done': ({ dir, pages, logger }: any) => {
				const outDir = clientDir ?? fileURLToPath(dir);
				const siteUrl = siteFromConfig ?? 'https://www.semantius.com';
				const indexUrl = new URL('/llms.txt', siteUrl).toString();

				const written: string[] = [];
				const skipped: string[] = [];
				const missing: string[] = [];
				const thin: Array<[string, number]> = [];
				const unnamedImages: string[] = [];
				const drift: Array<[string, string[]]> = [];
				let imagesRestored = 0;

				for (const page of pages as Array<{ pathname: string }>) {
					const pagePath = pathnameFor(page.pathname);
					if (!hasMarkdownTwin(pagePath)) continue;

					const mdRel = toMarkdownPath(pagePath).slice(1);
					const mdAbs = path.join(outDir, mdRel);

					const htmlAbs = path.join(
						outDir,
						pagePath === '/' ? 'index.html' : path.join(pagePath.slice(1), 'index.html'),
					);

					// Claimed by the route writer (Tier A or an override) during THIS
					// build. A file left over from a previous build does not count,
					// or a rebuild over a dirty dist would skip extraction silently.
					const stat = fs.existsSync(mdAbs) ? fs.statSync(mdAbs) : undefined;
					if (stat && stat.mtimeMs >= buildStart - 1000) {
						skipped.push(pagePath);
						if (stat.size < SIZE_FLOOR_BYTES) thin.push([mdRel, stat.size]);
						// Extraction is skipped, but the images still are not in it.
						if (fs.existsSync(htmlAbs)) {
							const { text, restored, dropped } = restoreImages(
								fs.readFileSync(mdAbs, 'utf8'),
								fs.readFileSync(htmlAbs, 'utf8'),
								siteUrl,
							);
							// `text` is the post-restore twin: compare what SHIPS.
							if (restored) {
								fs.writeFileSync(mdAbs, text, 'utf8');
								imagesRestored += restored;
							}
							if (dropped.length) unnamedImages.push(`${mdRel}: ${dropped.join(' | ')}`);

							// Parity: what the page says vs what the twin says. Only
							// source-derived twins can drift, so only they are checked -
							// and not the verbatim ones, whose contract is frozen bytes
							// (manifest.ts) rather than a re-rendering of the page.
							const verbatim =
								pagePath.endsWith('/blueprint') || pagePath.includes('/blueprints/source/');
							const pageMarkdown = verbatim
								? ''
								: sourceToMarkdown(
										{ kind: 'html', text: fs.readFileSync(htmlAbs, 'utf8') },
										{ siteUrl },
									);
							const lost = missingFromTwin(pageMarkdown, text);
							if (lost.length) drift.push([pagePath, lost]);
						}
						continue;
					}

					if (!fs.existsSync(htmlAbs)) {
						missing.push(pagePath);
						continue;
					}

					const html = fs.readFileSync(htmlAbs, 'utf8');
					const rawTitle = textBetween(html, /<title>([\s\S]*?)<\/title>/i);
					// The closing delimiter must be the quote that opened the
					// attribute, captured and back-referenced. A ["'] class on both
					// ends stops at the first apostrophe INSIDE a double-quoted
					// description: blueprints/hcm kept 87 of 777 characters and read
					// as a sentence cut mid-clause.
					const description = textBetween(
						html,
						/<meta\s+name=["']description["']\s+content=(["'])([\s\S]*?)\1/i,
						2,
					);

					// Page titles are "Thing - Semantius Agentic Data Platform"; the
					// suffix is site chrome and repeating it in every twin wastes
					// tokens and blurs what the page is about.
					// Both shapes occur: "About - Semantius ..." and the home page's
					// "Semantius | Engineered for the Unknown". Stripping only the
					// suffix left the home twin titled with browser-tab chrome.
					const title = decodeEntities(rawTitle ?? pagePath)
						.replace(/\s*[-|]\s*Semantius.*$/, '')
						.replace(/^Semantius\s*[-|]\s*/, '');

					let body = sourceToMarkdown({ kind: 'html', text: html }, { siteUrl });

					// The extracted body usually opens with the page's own <h1>, which
					// would give the twin two h1s alongside the one docHeader emits.
					// Lift it out and prefer it as the title: the visible heading
					// ("We Are Explorers") says more about the page than the <title>
					// tag ("About"), which exists for browser tabs and search results.
					// ATX (# Title) and setext (Title over ===). remark-stringify
					// falls back to setext when a heading contains a hard break, and
					// the home page's H1 does, so an ATX-only match left the twin
					// with two competing top-level titles.
					let heading: string | undefined;
					// A setext heading spans EVERY line above its underline, and the
					// home page's does: matching only the last line titled the twin
					// "No SaaS Silos. No Custom Code Debt." and dropped "The
					// Agent-Ready Architecture:" from in front of it.
					const leadingH1 =
						body.match(/^#\s+(.+?)\s*$/m) ??
						body.match(/^((?:.+\r?\n)+?)=+\s*$/m);
					if (leadingH1 && body.indexOf(leadingH1[0]) < 200) {
						// Hard breaks inside it are a trailing backslash per line.
						heading = leadingH1[1]
							.replace(/\\?\r?\n/g, ' ')
							.replace(/\s+/g, ' ')
							.trim();
						body = body.replace(leadingH1[0], '').replace(/^\s+/, '');
					}

					const trail = trailFromPath(pagePath);
					const markdown =
						docHeader({
							title: heading ?? title,
							description: description ? decodeEntities(description) : undefined,
							url: canonicalUrl(pagePath, siteUrl),
							// Whole trail, with the last crumb replaced by the page's real
							// heading: trailFromPath can only slug-case the URL segment
							// ("Itsm"), while the page calls itself "IT Service
							// Management".
							trail: [...trail.slice(0, -1), heading ?? title],
							indexUrl,
						}) +
						body +
						// No relationship data exists for these pages, so the footer
						// degrades to the index link rather than inventing links.
						docFooter([], indexUrl);

					fs.mkdirSync(path.dirname(mdAbs), { recursive: true });
					fs.writeFileSync(mdAbs, markdown, 'utf8');
					written.push(pagePath);
					if (markdown.length < SIZE_FLOOR_BYTES) thin.push([mdRel, markdown.length]);
				}

				const total = written.length + skipped.length;
				logger.info(
					`${total} markdown twins (${skipped.length} from source, ${written.length} extracted)`,
				);
				if (imagesRestored) {
					logger.info(`${imagesRestored} image(s) restored into source-derived twins`);
				}
				// An image on the page that the twin never names is content the agents
				// do not get. It means the alt text changed shape between the two
				// writers, not that the page has no picture.
				if (drift.length) {
					const worst = [...drift].sort((a, b) => b[1].length - a[1].length).slice(0, 10);
					const total = drift.reduce((n, [, lost]) => n + lost.length, 0);
					logger.warn(
						`${total} sentence(s) appear on a page but not in its source-derived ` +
							`twin, across ${drift.length} page(s). Either the twin writer cannot ` +
							`render something the page computes, or the two have drifted:` +
							worst
								.map(
									([page, lost]) =>
										`\n  ${page} (${lost.length}): ${lost[0].slice(0, 90)}`,
								)
								.join(''),
					);
				}
				if (unnamedImages.length) {
					logger.warn(
						`${unnamedImages.length} twin(s) omit an image the HTML page shows; no line ` +
							`matched its alt text:\n  ${unnamedImages.join('\n  ')}`,
					);
				}

				// Regression guard for the class of bug that shipped localhost URLs
				// inside docs twins: an origin baked into content-layer cache, keyed
				// on file digest, so it survived rebuilds and healed and re-broke
				// depending on whether content had changed. Nothing else notices.
				const allMd: string[] = [];
				const walk = (d: string) => {
					for (const e of fs.readdirSync(d, { withFileTypes: true })) {
						const f = path.join(d, e.name);
						if (e.isDirectory()) walk(f);
						else if (e.name.endsWith('.md')) allMd.push(f);
					}
				};
				walk(outDir);

				// Exactly two origins are wrong here: the placeholder a writer failed
				// to swap, and http://localhost:4321 - the dev SITE_URL, which is
				// the origin the original bug baked in. A twin's body may legitimately
				// name some other localhost address (the self-hosting docs are about a
				// stack you reach at http://localhost:3000), and matching any
				// `localhost:` warned on every build, which is how a real leak gets
				// ignored.
				const leaked = allMd.filter((f) => {
					const t = fs.readFileSync(f, 'utf8');
					return t.includes('http://localhost:4321') || t.includes('site.invalid');
				});
				if (leaked.length) {
					const names = leaked.slice(0, 10).map((f) => path.relative(outDir, f));
					logger.warn(
						`${leaked.length} twin(s) contain a dev or placeholder origin. The real ` +
							`site origin is not reaching a writer:\n  ${names.join('\n  ')}`,
					);
				}

				// The 56 verbatim blueprint sources are excluded from the 1:1 coverage
				// comparison above, so without this a workerd regression that emptied
				// them would be completely silent.
				// split/join rather than a regex: an earlier version used a character
				// class for the separator, which collapsed to '/' only and matched
				// nothing on Windows, reporting 0 sources on a build that emitted 56.
				const sources = allMd.filter((f) =>
					f.split(path.sep).join('/').includes('/blueprints/source/'),
				);
				logger.info(`${allMd.length} .md files total (${sources.length} verbatim blueprint sources)`);

				// Reports, never throws. A missing or thin twin is a quality problem,
				// not a release blocker, and Tier B has no unhandled case so a gap
				// here means a pipeline bug rather than a forgotten chore.
				if (missing.length) {
					logger.warn(
						`${missing.length} page(s) have no twin and no HTML to extract from:\n  ` +
							missing.join('\n  '),
					);
				}
				if (thin.length) {
					logger.warn(
						`${thin.length} twin(s) under ${SIZE_FLOOR_BYTES} bytes, which usually means ` +
							`extraction found almost nothing. Consider a hand-written override in ` +
							`src/data/twin-overrides/:\n  ` +
							thin.map(([f, n]) => `${f} (${n}B)`).join('\n  '),
					);
				}
			},
		},
	};
}
