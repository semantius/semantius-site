import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search as SearchIcon, X, Book, Zap, BookOpen, FileText, CornerDownRight } from "lucide-react";
import DevSearchModal from "./DevSearchModal";

const POPULAR_LINKS = [
  { label: "Overview", href: "/docs/overview", icon: Book },
  { label: "Features", href: "/features", icon: Zap },
  { label: "Guides", href: "/docs/guide", icon: BookOpen },
  { label: "Blog", href: "/blog", icon: FileText },
];

const MAX_RESULTS = 10;
const MAX_SUB_RESULTS = 3;

/**
 * Pagefind derives a result URL from the indexed file's location, so every hit
 * comes back in the directory form ("/features/", "/docs/cli/"). Canonical URLs
 * on this site carry no trailing slash (trailingSlash:'never'), so linking to
 * the raw value would make every search click pay a 307. Pagefind has no
 * trailing-slash option, so normalise here. The root must survive as "/".
 */
const canonicalHref = (url) => {
  // Sub-results carry an anchor ("/docs/cli/#install"), so the slash to strip
  // is not always the last character. Split it off first. The root stays "/".
  const [path, hash] = url.split("#");
  const trimmed = path.length > 1 ? path.replace(/\/+$/, "") : path;
  return hash === undefined ? trimmed : `${trimmed}#${hash}`;
};

/**
 * Loads the Pagefind runtime lazily and exposes a debounced search.
 *
 * The index lives at /pagefind/ in the build output (see pagefindIndex() in
 * astro.config.mjs). It is fetched through a variable specifier so Vite's
 * import analysis leaves it alone; Pagefind then pulls only the chunks that
 * match the typed words. In `astro dev` without a prior build the import 404s,
 * which we surface as `unavailable` so the modal can show setup instructions.
 */
function usePagefind(active) {
  const pagefindRef = useRef(null);
  const [status, setStatus] = useState("idle"); // idle | loading | ready | unavailable

  useEffect(() => {
    if (!active || pagefindRef.current || status === "loading" || status === "unavailable") return;
    let cancelled = false;
    setStatus("loading");
    (async () => {
      try {
        const url = "/pagefind/pagefind.js";
        const pf = await import(/* @vite-ignore */ url);
        await pf.init();
        if (cancelled) return;
        pagefindRef.current = pf;
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        console.warn("Pagefind index unavailable (run a build first):", err);
        setStatus("unavailable");
      }
    })();
    return () => { cancelled = true; };
  }, [active]);

  const search = useCallback(async (rawQuery) => {
    const pf = pagefindRef.current;
    if (!pf) return null;
    // Pagefind indexes only letters, digits, underscores and hyphens; symbols
    // such as "$" are dropped from tokens at index time but NOT from the query,
    // so "$today" matched nothing even though "today" did. Apply the same
    // normalisation to the query. Excerpts still show the original "$today".
    const query = rawQuery.replace(/[^\p{L}\p{N}_\-\s]/gu, " ").replace(/\s+/g, " ").trim();
    if (!query) return [];
    // debouncedSearch resolves to null when a newer query supersedes this one.
    const res = await pf.debouncedSearch(query, {}, 150);
    if (!res) return null;
    const data = await Promise.all(res.results.slice(0, MAX_RESULTS).map((r) => r.data()));
    return data.map((d) => ({
      url: canonicalHref(d.url),
      title: d.meta?.title || d.url,
      description: d.meta?.description || "",
      excerpt: d.excerpt,
      subResults: (d.sub_results || [])
        // The first sub result is usually the page itself; keep heading hits only.
        .filter((s) => s.anchor && s.url !== d.url)
        .slice(0, MAX_SUB_RESULTS)
        .map((s) => ({ ...s, url: canonicalHref(s.url) })),
    }));
  }, []);

  return { status, search };
}

export default function Search({ open, onClose, placeholder = "Search...", devModalLabels }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef(null);
  const { status, search } = usePagefind(open);

  useEffect(() => {
    const q = query.trim();
    if (!q || status !== "ready") { setResults([]); setSearching(false); return; }
    let stale = false;
    setSearching(true);
    search(q).then((r) => {
      if (stale || r === null) return; // superseded by a newer keystroke
      setResults(r);
      setSearching(false);
    });
    return () => { stale = true; };
  }, [query, status, search]);

  useEffect(() => {
    if (open && inputRef.current) setTimeout(() => inputRef.current.focus(), 100);
    if (!open) setQuery("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const down = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onClose]);

  const trackClick = (url, title) => {
    onClose();
    window.posthog?.capture('search_result_clicked', { result_url: url, result_title: title, query });
  };

  if (!open) return null;

  const hasQuery = query.trim().length > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 sm:p-6 md:p-20">
      <div
        className="overlay-fade-in absolute inset-0 bg-black/75 shadow-2xl"
        onClick={onClose}
      />

      <div
        className="overlay-scale-in relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-background border border-foreground/20 rounded-2xl shadow-2xl ring-1 ring-foreground/20 flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={placeholder}
      >
        <div className="relative border-b border-foreground/10 shrink-0">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/50" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            aria-label={placeholder}
            className="w-full bg-transparent py-4 pl-12 pr-12 text-foreground outline-hidden placeholder:text-foreground/50 text-lg"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full text-foreground/50 hover:bg-foreground/10 hover:text-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {status === "unavailable" ? (
            <DevSearchModal onClose={onClose} labels={devModalLabels} />
          ) : hasQuery ? (
            results.length > 0 ? (
              <div className="space-y-4">
                {results.map((item) => (
                  <div
                    key={item.url}
                    className="rounded-xl border border-foreground/10 bg-foreground/5 hover:bg-foreground/10 transition-colors"
                  >
                    <a
                      href={item.url}
                      onClick={() => trackClick(item.url, item.title)}
                      className="block p-4 group"
                    >
                      <h4 className="font-bold text-lg text-foreground group-hover:text-primary mb-1">
                        {item.title}
                      </h4>
                      <p
                        className="text-sm text-foreground/70 line-clamp-2 [&_mark]:bg-transparent [&_mark]:text-primary [&_mark]:font-semibold"
                        dangerouslySetInnerHTML={{ __html: item.excerpt }}
                      />
                      <div className="mt-2 text-xs text-foreground/50 font-mono">
                        {item.url}
                      </div>
                    </a>
                    {item.subResults.length > 0 && (
                      <ul className="border-t border-foreground/10 px-4 py-2 space-y-1">
                        {item.subResults.map((s) => (
                          <li key={s.url}>
                            <a
                              href={s.url}
                              onClick={() => trackClick(s.url, s.title)}
                              className="flex items-start gap-2 py-1.5 text-sm text-foreground/80 hover:text-primary"
                            >
                              <CornerDownRight size={14} className="mt-0.5 shrink-0 text-foreground/40" />
                              <span>
                                <span className="font-semibold">{s.title}</span>
                                <span
                                  className="block text-xs text-foreground/60 line-clamp-1 [&_mark]:bg-transparent [&_mark]:text-primary [&_mark]:font-semibold"
                                  dangerouslySetInnerHTML={{ __html: s.excerpt }}
                                />
                              </span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-foreground/50">
                {searching || status !== "ready" ? "Searching..." : `No results found for "${query}"`}
              </div>
            )
          ) : (
            <>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-foreground/50 mb-4">
                Popular Links
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {POPULAR_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={onClose}
                    className="flex items-center gap-3 p-3 rounded-xl bg-foreground/5 hover:bg-foreground/10 transition-colors border border-foreground/5 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-background border border-foreground/10 flex items-center justify-center text-foreground group-hover:text-primary transition-colors">
                      <link.icon size={16} />
                    </div>
                    <span className="text-sm font-bold text-foreground group-hover:text-primary">{link.label}</span>
                  </a>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
