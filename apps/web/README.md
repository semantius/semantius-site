# semantius-site

The Astro app that builds `www.semantius.com`. The repository overview, the docs
layout and the markdown twins are described in the [root README](../../README.md).

## Commands

Run these from the repository root.

```bash
pnpm dev                # astro dev on http://localhost:4321
pnpm build              # static build with the Cloudflare adapter
pnpm preview:wrangler   # deploy a branch preview, URL written to .preview-url.md
```

A plain `pnpm build` produces exactly what production serves: the adapter
defaults to `cloudflare` in `astro.config.mjs`.

## Configuration

`src/site.config.ts` holds the site name, description, navigation and social
accounts. Every entry under `ACTION_LINKS.social` is published as structured
data claiming that profile belongs to Semantius, so only list accounts the
company owns.

| Variable   | Purpose                                                  | Default                    |
| :--------- | :------------------------------------------------------- | :------------------------- |
| `SITE_URL` | Origin used for canonical URLs, the sitemap and twins.   | `https://www.semantius.com` |
| `ADAPTER`  | Build adapter. Only `cloudflare` is deployed.            | `cloudflare`               |

## Third-Party Code

The markdown twin code in `src/lib/dualmark/` is adapted from
[dualmark](https://github.com/dodopayments/dualmark) under the Apache License
2.0. Its `NOTICE`, license text and per-file headers must stay in place.
