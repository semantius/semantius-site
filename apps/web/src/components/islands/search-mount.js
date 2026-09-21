import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import Search from './Search.jsx';

let root = null;
let open = false;
let props = {};
const listeners = new Set();

function emit() {
  for (const fn of listeners) fn(open);
}

function render() {
  if (!root) return;
  root.render(
    createElement(Search, {
      ...props,
      open,
      onClose: close,
    }),
  );
}

function ensureRoot() {
  if (root) return;
  let el = document.getElementById('search-overlay-root');
  if (!el) {
    el = document.createElement('div');
    el.id = 'search-overlay-root';
    document.body.appendChild(el);
  }
  root = createRoot(el);
}

export function subscribe(fn) {
  listeners.add(fn);
  fn(open);
  return () => listeners.delete(fn);
}

export function openSearch(nextProps, trigger) {
  props = nextProps;
  ensureRoot();
  if (open) return;
  open = true;
  if (trigger) window.posthog?.capture('search_opened', { trigger });
  emit();
  render();
}

export function close() {
  if (!open) return;
  open = false;
  emit();
  render();
}
