/**
 * Tier B, the universal fallback, plus the coverage report.
 *
 * Runs in astro:build:done, which is the only place the rendered HTML exists
 * and which executes in NODE under every adapter (the workerd constraint
 * applies to prerendered route modules, not to integration hooks). That is why
 * Tier B cannot live in the .md route: a getStaticPaths route runs before any
 * HTML has been written.
 *
 * Division of labour with the route writer:
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

function textBetween(html: string, re: RegExp): string | undefined {
	const m = html.match(re);
	return m?.[1]?.trim() || undefined;
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

				for (const page of pages as Array<{ pathname: string }>) {
					const pagePath = pathnameFor(page.pathname);
					if (!hasMarkdownTwin(pagePath)) continue;

					const mdRel = toMarkdownPath(pagePath).slice(1);
					const mdAbs = path.join(outDir, mdRel);

					// Claimed by the route writer (Tier A or an override) during THIS
					// build. A file left over from a previous build does not count,
					// or a rebuild over a dirty dist would skip extraction silently.
					const stat = fs.existsSync(mdAbs) ? fs.statSync(mdAbs) : undefined;
					if (stat && stat.mtimeMs >= buildStart - 1000) {
						skipped.push(pagePath);
						if (stat.size < SIZE_FLOOR_BYTES) thin.push([mdRel, stat.size]);
						continue;
					}

					const htmlAbs = path.join(
						outDir,
						pagePath === '/' ? 'index.html' : path.join(pagePath.slice(1), 'index.html'),
					);
					if (!fs.existsSync(htmlAbs)) {
						missing.push(pagePath);
						continue;
					}

					const html = fs.readFileSync(htmlAbs, 'utf8');
					const rawTitle = textBetween(html, /<title>([\s\S]*?)<\/title>/i);
					const description = textBetween(
						html,
						/<meta\s+name=["']description["']\s+content=["']([\s\S]*?)["']/i,
					);

					// Page titles are "Thing - Semantius Agentic Data Platform"; the
					// suffix is site chrome and repeating it in every twin wastes
					// tokens and blurs what the page is about.
					const title = decodeEntities(rawTitle ?? pagePath).replace(
						/\s*[-|]\s*Semantius.*$/,
						'',
					);

					let body = sourceToMarkdown({ kind: 'html', text: html }, { siteUrl });

					// The extracted body usually opens with the page's own <h1>, which
					// would give the twin two h1s alongside the one docHeader emits.
					// Lift it out and prefer it as the title: the visible heading
					// ("We Are Explorers") says more about the page than the <title>
					// tag ("About"), which exists for browser tabs and search results.
					let heading: string | undefined;
					const leadingH1 = body.match(/^#\s+(.+?)\s*$/m);
					if (leadingH1 && body.indexOf(leadingH1[0]) < 200) {
						heading = leadingH1[1];
						body = body.replace(leadingH1[0], '').replace(/^\s+/, '');
					}

					const trail = trailFromPath(pagePath);
					const markdown =
						docHeader({
							title: heading ?? title,
							description: description ? decodeEntities(description) : undefined,
							url: canonicalUrl(pagePath, siteUrl),
							// The trail ends with the page itself, so drop the last level:
							// a breadcrumb should not name the page you are already on.
							trail: trail.slice(0, -1),
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

				const leaked = allMd.filter((f) => {
					const t = fs.readFileSync(f, 'utf8');
					return t.includes('localhost:') || t.includes('site.invalid');
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
				const sources = allMd.filter((f) => /-semantic-blueprint\.md$/.test(f));
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
