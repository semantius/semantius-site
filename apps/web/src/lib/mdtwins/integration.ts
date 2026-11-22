/**
 * The Astro integration: writes every twin after the build, writes
 * llms-full.txt, and serves twins in `astro dev`.
 *
 * Twins are written in astro:build:done because that is the first moment the
 * built HTML exists, and that hook runs in Node under every adapter. A route
 * cannot do it: routes render before the HTML they would read has been
 * written, and the Cloudflare adapter prerenders them inside workerd.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { twinFromHtml } from './compose';
import { hasMarkdownTwin, markdownUrl, normalizePagePath, toMarkdownPath } from './paths';

/** Hand-written twins, relative to the project root. See README.md. */
const OVERRIDES_DIR = 'src/lib/mdtwins/overrides';

/** Twins below this are almost certainly a bug, or a page worth an override. */
const SIZE_FLOOR_BYTES = 200;

/** The hand-written twin for a page, if one exists: overrides/<page path>.md. */
function overrideFor(root: string, pagePath: string): string | undefined {
	const file = path.join(root, OVERRIDES_DIR, toMarkdownPath(pagePath));
	return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : undefined;
}

/**
 * llms-full.txt: every twin, one per line, with its title.
 *
 * Deliberately an INDEX, not a concatenation of the site. A full-text dump
 * would be about 2 MB, most of it blueprint entity tables, which no agent can
 * usefully hold in context. llms-full.txt is a convention, not a
 * specification, so it can be the useful artifact rather than the literal one.
 * Written here because only now is every twin known.
 */
function llmsFull(entries: Array<{ url: string; title: string }>, siteUrl: string): string {
	const lines = [...entries].sort((a, b) => a.url.localeCompare(b.url));
	return [
		'# Semantius: index of every markdown twin',
		'',
		'Every URL below serves markdown. The HTML page for each is the same URL',
		'without the ".md" suffix, and /index.md is the home page. Canonical URLs',
		'carry no trailing slash: a slashed URL redirects to the slash-less one.',
		'',
		`Curated, grouped index: ${new URL('/llms.txt', siteUrl).toString()}`,
		'',
		...lines.map((l) => `${l.url}\t${l.title}`),
		'',
	].join('\n');
}

export function markdownTwins() {
	let root = process.cwd();
	let clientDir: string | undefined;
	let siteFromConfig: string | undefined;
	let buildStart = 0;

	return {
		name: 'markdown-twins',
		hooks: {
			'astro:config:setup': ({ config }: any) => {
				root = fileURLToPath(config.root);
				if (config.adapter) clientDir = fileURLToPath(config.build.client);
				// Take the origin from the RESOLVED Astro config, never from
				// process.env: Vite merges apps/web/.env (SITE_URL=localhost:4321)
				// into process.env after astro.config.mjs is evaluated, so reading it
				// later bakes the dev URL into production output.
				if (config.site) siteFromConfig = String(config.site).replace(/\/+$/, '');
			},

			// `astro dev` has no build output to read, so a twin is made on request
			// from the page the dev server renders, by the same twinFromHtml() the
			// build uses. A .md request that is not a twin (the blueprint source
			// downloads) finds no HTML page and passes through to its route.
			'astro:server:setup': ({ server }: any) => {
				server.middlewares.use(async (req: any, res: any, next: (err?: unknown) => void) => {
					try {
						const pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://dev').pathname);
						if (!pathname.endsWith('.md')) return next();
						const pagePath = pathname === '/index.md' ? '/' : pathname.slice(0, -3);
						if (!hasMarkdownTwin(pagePath)) return next();

						const origin = `http://${req.headers.host}`;
						let markdown = overrideFor(root, pagePath);
						if (markdown === undefined) {
							const page = await fetch(new URL(pagePath, origin));
							if (!page.ok || !(page.headers.get('content-type') ?? '').includes('text/html')) {
								return next();
							}
							markdown = twinFromHtml(await page.text(), pagePath, siteFromConfig ?? origin);
						}
						res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
						res.end(markdown);
					} catch (err) {
						next(err);
					}
				});
			},

			'astro:build:start': () => {
				buildStart = Date.now();
			},

			'astro:build:done': ({ dir, pages, logger }: any) => {
				const outDir = clientDir ?? fileURLToPath(dir);
				const siteUrl = siteFromConfig ?? 'https://www.semantius.com';

				const extracted: string[] = [];
				const overridden: string[] = [];
				const missing: string[] = [];
				const thin: Array<[string, number]> = [];
				const index: Array<{ url: string; title: string }> = [];

				for (const page of pages as Array<{ pathname: string }>) {
					const pagePath = normalizePagePath(page.pathname);
					if (!hasMarkdownTwin(pagePath)) continue;

					const htmlAbs = path.join(
						outDir,
						pagePath === '/' ? 'index.html' : path.join(pagePath.slice(1), 'index.html'),
					);
					if (!fs.existsSync(htmlAbs)) {
						missing.push(pagePath);
						continue;
					}

					const override = overrideFor(root, pagePath);
					const markdown =
						override ?? twinFromHtml(fs.readFileSync(htmlAbs, 'utf8'), pagePath, siteUrl);
					(override === undefined ? extracted : overridden).push(pagePath);

					const mdRel = toMarkdownPath(pagePath).slice(1);
					const mdAbs = path.join(outDir, mdRel);
					// A .md file at this path written during THIS build came from a route
					// (the blueprint source downloads), so a page and a download share a
					// path and one would silently overwrite the other. The one deliberate
					// hard failure here, because what it prevents is data loss. A file
					// left over from an earlier build is older than buildStart.
					if (fs.existsSync(mdAbs) && fs.statSync(mdAbs).mtimeMs >= buildStart - 1000) {
						throw new Error(
							`${mdRel} is both a route's output and the twin of ${pagePath}. ` +
								`Move one of them: one file would overwrite the other.`,
						);
					}
					fs.mkdirSync(path.dirname(mdAbs), { recursive: true });
					fs.writeFileSync(mdAbs, markdown, 'utf8');
					if (markdown.length < SIZE_FLOOR_BYTES) thin.push([mdRel, markdown.length]);
					index.push({
						url: markdownUrl(pagePath, siteUrl),
						// The twin's own title: the first "# " heading, which docHeader always writes.
						title: markdown.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? pagePath,
					});
				}

				fs.writeFileSync(path.join(outDir, 'llms-full.txt'), llmsFull(index, siteUrl), 'utf8');
				logger.info(
					`${extracted.length + overridden.length} markdown twins ` +
						`(${extracted.length} extracted, ${overridden.length} hand-written overrides)`,
				);

				// Regression guard for the class of bug that once shipped localhost URLs
				// inside twins: the dev SITE_URL reaching a writer instead of the
				// configured site. A twin may legitimately name some other localhost
				// address (the self-hosting docs are about a stack at
				// http://localhost:3000), so only the dev origin itself is matched.
				const allMd: string[] = [];
				const walk = (d: string) => {
					for (const e of fs.readdirSync(d, { withFileTypes: true })) {
						const f = path.join(d, e.name);
						if (e.isDirectory()) walk(f);
						else if (e.name.endsWith('.md')) allMd.push(f);
					}
				};
				walk(outDir);
				const leaked = allMd.filter((f) => fs.readFileSync(f, 'utf8').includes('http://localhost:4321'));
				if (leaked.length) {
					const names = leaked.slice(0, 10).map((f) => path.relative(outDir, f));
					logger.warn(
						`${leaked.length} twin(s) contain the dev origin http://localhost:4321. The ` +
							`configured site origin is not reaching a writer:\n  ${names.join('\n  ')}`,
					);
				}

				// The verbatim blueprint sources are not twins and are written by their
				// own route. Counted here so a regression that emptied or dropped them
				// is visible in the build log. split/join rather than a regex: an
				// earlier character-class version matched nothing on Windows.
				const sources = allMd.filter((f) =>
					f.split(path.sep).join('/').includes('/blueprints/source/'),
				);
				logger.info(`${allMd.length} .md files total (${sources.length} verbatim blueprint sources)`);

				// Reports, never throws: a missing or thin twin is a quality problem,
				// not a release blocker.
				if (missing.length) {
					logger.warn(
						`${missing.length} page(s) have no HTML to make a twin from:\n  ` + missing.join('\n  '),
					);
				}
				if (thin.length) {
					logger.warn(
						`${thin.length} twin(s) under ${SIZE_FLOOR_BYTES} bytes, which usually means ` +
							`extraction found almost nothing. Consider a hand-written override in ` +
							`${OVERRIDES_DIR}/:\n  ` +
							thin.map(([f, n]) => `${f} (${n}B)`).join('\n  '),
					);
				}
			},
		},
	};
}
