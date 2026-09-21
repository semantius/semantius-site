import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import SignUpModal from './SignUpModal.jsx';

let root = null;
let open = false;
let props = {};
const listeners = new Set();

function emit() {
  for (const fn of listeners) fn(open);
}

function setHash(on) {
  if (on) {
    if (window.location.hash !== '#signup') {
      window.history.replaceState(null, '', '#signup');
    }
  } else if (window.location.hash === '#signup') {
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }
}

function render() {
  if (!root) return;
  root.render(
    createElement(SignUpModal, {
      ...props,
      open,
      onClose: close,
    }),
  );
}

function ensureRoot() {
  if (root) return;
  let el = document.getElementById('signup-overlay-root');
  if (!el) {
    el = document.createElement('div');
    el.id = 'signup-overlay-root';
    document.body.appendChild(el);
  }
  root = createRoot(el);
}

export function subscribe(fn) {
  listeners.add(fn);
  fn(open);
  return () => listeners.delete(fn);
}

export function openModal(nextProps, trigger) {
  props = nextProps;
  ensureRoot();
  if (open) return;
  open = true;
  setHash(true);
  if (trigger) window.posthog?.capture('signup_modal_opened', { trigger });
  emit();
  render();
}

export function close() {
  if (!open) return;
  open = false;
  setHash(false);
  emit();
  render();
}
