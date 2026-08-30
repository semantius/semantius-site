import type { CollectionEntry } from 'astro:content';

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

function walk(node: NavNode, acc: NavNode[]) {
  if (node.doc && node.path !== '/docs') acc.push(node);
  for (const c of node.children) walk(c, acc);
}

// Serializable shape for passing to React (no Astro CollectionEntry refs).
export interface SerializableNavNode {
  segment: string;
  hasDoc: boolean;
  children: SerializableNavNode[];
  navTitle: string;
  path: string;
}

export function serializeTree(node: NavNode): SerializableNavNode {
  return {
    segment: node.segment,
    hasDoc: !!node.doc,
    children: node.children.map(serializeTree),
    navTitle: node.navTitle,
    path: node.path,
  };
}

// A "collection" is a top-level folder under src/content/docs, surfaced as a
// tab above the docs columns. Array order is the tab display order; adding a
// future collection means adding a folder plus one row here.
export interface DocsCollectionDef {
  slug: string;
  label: string;
  /** Shown on the /docs hub card. */
  description: string;
}

export const DOCS_COLLECTIONS: DocsCollectionDef[] = [
  {
    slug: 'guide',
    label: 'Guide',
    description:
      'Step-by-step walkthroughs that take you from a blank project to a deployed semantic model.',
  },
  {
    slug: 'reference',
    label: 'Reference',
    description:
      'Detailed documentation for models, business logic, MCP connectors, agent skills and the CLI.',
  },
];

// Where /docs lands, and the fallback sidebar for any docs page outside a
// registered collection. Guide is a placeholder for now.
export const DEFAULT_DOCS_COLLECTION = 'reference';

export interface DocsCollectionNav {
  slug: string;
  label: string;
  description: string;
  node: NavNode;
  landingPath: string;
}

export function getDocsCollectionNavs(tree: NavNode): DocsCollectionNav[] {
  return DOCS_COLLECTIONS.flatMap((def) => {
    const node = tree.children.find((c) => c.segment === def.slug);
    // A registry entry without a matching folder is skipped rather than
    // rendering a tab that 404s.
    if (!node) return [];
    // Every collection should have its own index.mdx start page, which the tab
    // and the breadcrumb both link to. The fallback keeps a collection that
    // lacks one navigable, landing on its first page instead.
    const landingPath = node.doc ? node.path : (flattenTree(node)[0]?.path ?? node.path);
    return [{ slug: def.slug, label: def.label, description: def.description, node, landingPath }];
  });
}

export function findCollectionForPath(
  navs: DocsCollectionNav[],
  path: string,
): DocsCollectionNav | null {
  return navs.find((c) => path === c.node.path || path.startsWith(`${c.node.path}/`)) ?? null;
}

// Find the topmost ancestor (just under root) of the node matching a path.
export function findTopAncestor(root: NavNode, path: string): NavNode | null {
  for (const child of root.children) {
    if (containsPath(child, path)) return child;
  }
  return null;
}

function containsPath(node: NavNode, path: string): boolean {
  if (node.path === path) return true;
  return node.children.some((c) => containsPath(c, path));
}
