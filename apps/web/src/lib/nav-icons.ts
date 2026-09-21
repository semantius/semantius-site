import type { LucideIcon } from 'lucide-react';
import {
  Book,
  CreditCard,
  Database,
  FileClock,
  Newspaper,
  Wand2,
  Zap,
} from 'lucide-react';

// Named imports (not `import *`) so the production build tree-shakes lucide
// down to the handful of icons `NAV_LINKS` actually names. A namespace import
// keeps every icon reachable and ships the whole package.
export const NAV_ICONS = {
  Book,
  CreditCard,
  Database,
  FileClock,
  Newspaper,
  Wand2,
  Zap,
} as const satisfies Record<string, LucideIcon>;

export function getNavIcon(name: string | undefined): LucideIcon | null {
  if (!name) return null;
  return (NAV_ICONS as Record<string, LucideIcon>)[name] ?? null;
}
