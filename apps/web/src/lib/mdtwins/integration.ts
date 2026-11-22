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
import {
	hasMarkdownTwin,
	markdownUrl,
	normalizePagePath,
	pagePathOfTwin,
	toMarkdownPath,
} from './paths';

/** Hand-written twins, relative to the project root. See README.md. */
const OVERRIDES_DIR = 'src/lib/mdtwins/overrides';

/** Twins below this are almost certainly a bug, or a page worth an override. */
const SIZE_FLOOR_BYTES = 200;

/**
 * The dev SITE_URL. Found in a twin, it means the dev origin reached the writer
 * instead of the configured site, the bug that once shipped localhost links in
 * twins. Other localhost addresses are legitimate content (the self-hosting
 * docs are about a stack at http://localhost:3000), so only this one is matched.
 */
const DEV_ORIGIN = 'http://localhost:4321';

/** The hand-written twin for a page, if one exists: overrides/<page path>.md. */
function overrideFor(root: string, pagePath: string): string | undefined {
	const file = path.join(root, OVERRIDES_DIR, toMarkdownPath(pagePath));
	return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : undefined;
}

/**
 * llms-full.txt: every twin, one per line, with its title.
 *
 * Deliberately an INDEX, not a concatenation of the site: a full-text dump is
 * more than an agent can usefully hold in context, and every twin is one fetch
 * away. llms-full.txt is a convention, not a specification, so it can be the
 * useful artifact rather than the literal one.
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
	let site = '';

	return {
		name: 'markdown-twins',
		hooks: {
			'astro:config:setup': ({ config }: any) => {
				root = fileURLToPath(config.root);
				if (config.adapter) clientDir = fileURLToPath(config.build.client);
				// Take the origin from the RESOLVED Astro config, never from
				// process.env: Vite merges apps/web/.env (SITE_URL=localhost:4321)
				// into process.env after astro.config.mjs is evaluated, so reading it
				// later bakes the dev URL into production output. astro.config.mjs
				// always sets `site`.
				site = String(config.site).replace(/\/+$/, '');
			},

			// `astro dev` has no build output to read, so a twin is made on request
			// from the page the dev server renders, by the same twinFromHtml() the
			// build uses. A .md request with no HTML page behind it passes through.
			'astro:server:setup': ({ server }: any) => {
				server.middlewares.use(async (req: any, res: any, next: (err?: unknown) => void) => {
					try {
						const pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://dev').pathname);
						if (!pathname.endsWith('.md')) return next();
						const pagePath = pagePathOfTwin(pathname);
						if (!hasMarkdownTwin(pagePath)) return next();

						let markdown = overrideFor(root, pagePath);
						if (markdown === undefined) {
							// redirect: 'manual', so a redirected page (a vanity URL) is not
							// followed here: its .md form has a redirect of its own in Astro's
							// config, which answers it as the deployed site does.
							const page = await fetch(new URL(pagePath, `http://${req.headers.host}`), {
								redirect: 'manual',
							});
							if (!page.ok || !(page.headers.get('content-type') ?? '').includes('text/html')) {
								return next();
							}
							markdown = twinFromHtml(await page.text(), pagePath, site).markdown;
						}
						res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
						res.end(markdown);
					} catch (err) {
						next(err);
					}
				});
			},

			'astro:build:done': ({ dir, pages, logger }: any) => {
				const outDir = clientDir ?? fileURLToPath(dir);

				const extracted: string[] = [];
				const overridden: string[] = [];
				const missing: string[] = [];
				const thin: Array<[string, number]> = [];
				const leaked: string[] = [];
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

					// Made even when an override replaces it: its title and noindex come
					// from the page, which the override does not change.
					const twin = twinFromHtml(fs.readFileSync(htmlAbs, 'utf8'), pagePath, site);
					const override = overrideFor(root, pagePath);
					const markdown = override ?? twin.markdown;
					(override === undefined ? extracted : overridden).push(pagePath);

					const mdRel = toMarkdownPath(pagePath).slice(1);
					const mdAbs = path.join(outDir, mdRel);
					fs.mkdirSync(path.dirname(mdAbs), { recursive: true });
					fs.writeFileSync(mdAbs, markdown, 'utf8');
					if (markdown.length < SIZE_FLOOR_BYTES) thin.push([mdRel, markdown.length]);
					if (markdown.includes(DEV_ORIGIN)) leaked.push(mdRel);
					// Same rule as advertisedTwinUrl(): a page that asks not to be
					// indexed is not pointed at. Its twin is still written.
					if (!twin.noindex) {
						index.push({
							url: markdownUrl(pagePath, site),
							// An override's own "# " line names it; otherwise the page does.
							title: (override && override.match(/^#\s+(.+)$/m)?.[1]?.trim()) || twin.title,
						});
					}
				}

				fs.writeFileSync(path.join(outDir, 'llms-full.txt'), llmsFull(index, site), 'utf8');
				logger.info(
					`${extracted.length + overridden.length} markdown twins ` +
						`(${extracted.length} extracted, ${overridden.length} hand-written overrides)`,
				);

				if (leaked.length) {
					logger.warn(
						`${leaked.length} twin(s) contain the dev origin ${DEV_ORIGIN}. The configured ` +
							`site origin is not reaching the writer:\n  ${leaked.slice(0, 10).join('\n  ')}`,
					);
				}

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
