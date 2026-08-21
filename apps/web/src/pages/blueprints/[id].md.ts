import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const prerender = true;

// Blueprints live at /blueprints in the repo root (two levels above apps/web).
// The raw markdown is bundled at build time via import.meta.glob instead of
// being read with node:fs: the site has no SSR routes, so Astro builds in
// static mode and the Cloudflare adapter prerenders inside workerd, where
// node:fs cannot see the repo. A readFileSync here silently produced empty
// .md files on Cloudflare builds.
const rawBlueprints = import.meta.glob('../../../../../blueprints/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const byId = new Map(
  Object.entries(rawBlueprints).map(([file, body]) => [file.split('/').pop()!.replace(/\.md$/, ''), body]),
);

export async function getStaticPaths() {
  const blueprints = await getCollection('blueprints');
  return blueprints.map((blueprint) => ({ params: { id: blueprint.id } }));
}

export const GET: APIRoute = ({ params }) => {
  const body = byId.get(params.id!);
  if (body === undefined) return new Response('Not found', { status: 404 });
  return new Response(body, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
};
