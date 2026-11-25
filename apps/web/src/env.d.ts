/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  readonly DEFAULT_LOCALE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// The /botsim chats, src/content/botsim/*.yaml, parsed at build time by the
// botsim-chats Vite plugin in astro.config.mjs.
declare module '*.yaml' {
  const data: unknown;
  export default data;
}