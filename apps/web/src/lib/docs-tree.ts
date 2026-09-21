import type { CollectionEntry } from 'astro:content';
import { z } from 'astro/zod';
import navManifest from '../content/docs/nav.json';

// `nav.json` declares which top-level folders are tabs, and which top-level
// folders each tab shows, in order. Folders no longer live inside the tab they
// belong to: every one of them sits directly under src/content/docs, and
// membership is a line in the manifest rather than a position on disk. Moving a
// folder from one tab to another is therefore a manifest edit with no file move
// and no URL change.
//
// What the manifest does NOT own:
//   - page order inside a folder, which comes from each page's `order`
//     frontmatter
//   - labels and descriptions, which come from each folder's index.mdx
//   - URLs, which come from the folder structure via `pages/docs/[...slug].astro`
//
// A folder that no tab lists still builds and still resolves by deep link, it
// simply appears in no sidebar and under no tab. The manifest is a whitelist for
// display, never for routing.
//
// It is validated rather than trusted: nothing in `astro build` typechecks, so a
// malformed manifest would otherwise surface as a silently broken nav instead of
// a build failure.

const navSchema = z
  .object({
    $schema: z.string().optional(),
    tabs: z
      .array(
        z
          .object({
            folder: z.string().min(1),
            folders: z.array(z.string().min(1)),
          })
          .strict(),
      )
      .min(1),
  })
  .strict();

function loadNav() {
  const parsed = navSchema.safeParse(navManifest);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid src/content/docs/nav.json:\n${issues}`);
  }
  return parsed.data;
}

const nav = loadNav();

export interface NavNode {
  segment: string;
  doc?: CollectionEntry<'docs'>;
  children: NavNode[];
  order: number;
  navTitle: string;
  path: string;
}

function defaultLabel(segment: string): string {
  return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
}

export function buildDocsTree(docs: CollectionEntry<'docs'>[]): NavNode {
  const root: NavNode = {
    segment: '',
    children: [],
    order: -Infinity,
    navTitle: '',
    path: '/docs',
  };

  for (const doc of docs) {
    const fullSlug = doc.id.replace(/\.[^/.]+$/, '');
    const parts = fullSlug.split('/');
    let cursor = root;
    let segPath = '';

    for (let i = 0; i < parts.length; i++) {
      const seg = parts[i];
      const isLast = i === parts.length - 1;

      // A file named `index` attaches its doc to the parent folder node rather
      // than creating a new child. This lets a folder also be a page.
      if (isLast && seg === 'index') {
        cursor.doc = doc;
        cursor.order = doc.data.order ?? cursor.order;
        cursor.navTitle = doc.data.navTitle ?? doc.data.title ?? cursor.navTitle;
        break;
      }

      segPath = segPath ? `${segPath}/${seg}` : seg;
      let child = cursor.children.find((c) => c.segment === seg);
      if (!child) {
        child = {
          segment: seg,
          children: [],
          order: 99,
          navTitle: defaultLabel(seg),
          path: `/docs/${segPath}`,
        };
        cursor.children.push(child);
      }
      if (isLast) {
        child.doc = doc;
        child.order = doc.data.order ?? 99;
        child.navTitle = doc.data.navTitle ?? doc.data.title;
      }
      cursor = child;
    }
  }

  sortRecursive(root);
  return root;
}

// Ordering below the top level is entirely the `order` frontmatter, unchanged.
// The top level is not sorted here at all: a tab's folders are assembled in the
// order nav.json lists them.
function sortRecursive(node: NavNode) {
  node.children.sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return a.navTitle.localeCompare(b.navTitle);
  });
  for (const c of node.children) sortRecursive(c);
}

// Depth-first flattening in display order: each node with a doc appears
// before its children, mirroring how the user reads the nav top-to-bottom.
export function flattenTree(node: NavNode): NavNode[] {
  const acc: NavNode[] = [];
  walk(node, acc);
  return acc;
}

// Same, across an assembled list of folders rather than one subtree.
export function flattenNodes(nodes: NavNode[]): NavNode[] {
  const acc: NavNode[] = [];
  for (const n of nodes) walk(n, acc);
  return acc;
}

function walk(node: NavNode, acc: NavNode[]) {
  if (node.doc && node.path !== '/docs') acc.push(node);
  for (const c of node.children) walk(c, acc);
}

export interface DocsCollectionNav {
  slug: string;
  label: string;
  description: string;
  /** The tab's own folder node, holding its index.mdx start page. */
  node: NavNode;
  /** The folders this tab shows, assembled in nav.json order. */
  folders: NavNode[];
  landingPath: string;
}

// Tabs are the `tabs` array in nav.json, in array order. Each tab's folders are
// looked up among the top-level folders and assembled in the listed order, so
// the sidebar is built from the manifest rather than from filesystem nesting.
//
// The manifest carries no copy: the tab label and the hub-card description come
// from the folder's own index.mdx, so there is exactly one place to edit either
// and they cannot drift apart.
export function getDocsCollectionNavs(tree: NavNode): DocsCollectionNav[] {
  const byName = new Map(tree.children.map((c) => [c.segment, c]));
  // A folder belonging to two tabs would make the active-tab lookup ambiguous,
  // so it is rejected rather than silently resolved to whichever tab is first.
  const claimedBy = new Map<string, string>();

  return nav.tabs.map((tab) => {
    const node = byName.get(tab.folder);
    if (!node) {
      throw new Error(
        `src/content/docs/nav.json declares tab "${tab.folder}" but src/content/docs/${tab.folder}/ does not exist.`,
      );
    }

    const folders = tab.folders.map((name) => {
      const child = byName.get(name);
      if (!child) {
        throw new Error(
          `src/content/docs/nav.json: tab "${tab.folder}" lists "${name}", but src/content/docs/${name} does not exist.`,
        );
      }
      const claimed = claimedBy.get(name);
      if (claimed) {
        throw new Error(
          `src/content/docs/nav.json: "${name}" is listed by both tab "${claimed}" and tab "${tab.folder}".`,
        );
      }
      claimedBy.set(name, tab.folder);
      return child;
    });

    // Every tab should have its own index.mdx start page, which the tab and the
    // breadcrumb both link to, and which supplies the label and description
    // below. The fallback keeps a tab that lacks one navigable, landing on its
    // first page instead.
    const landingPath = node.doc ? node.path : (flattenNodes(folders)[0]?.path ?? node.path);

    return {
      slug: tab.folder,
      label: node.navTitle,
      description: node.doc?.data.description ?? '',
      node,
      folders,
      landingPath,
    };
  });
}

// The URL no longer contains the tab, so the active tab is the one whose own
// page this is, or the one listing the folder the page sits in.
export function findCollectionForPath(
  navs: DocsCollectionNav[],
  path: string,
): DocsCollectionNav | null {
  return (
    navs.find(
      (c) =>
        path === c.node.path ||
        c.folders.some((f) => path === f.path || path.startsWith(`${f.path}/`)),
    ) ?? null
  );
}

// Which of the tab's folders contains this path, for the breadcrumb.
export function findTopAncestor(folders: NavNode[], path: string): NavNode | null {
  return folders.find((f) => containsPath(f, path)) ?? null;
}

function containsPath(node: NavNode, path: string): boolean {
  if (node.path === path) return true;
  return node.children.some((c) => containsPath(c, path));
}
