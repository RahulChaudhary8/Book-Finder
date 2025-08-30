import React, { useEffect, useMemo, useRef, useState } from "react";

const LIMIT = 20;

function buildCoverUrl(doc, size = "M") {
  if (doc.cover_i) {
    return `https://covers.openlibrary.org/b/id/${doc.cover_i}-${size}.jpg`;
  }
  return null;
}

function toBookKey(doc) {
  return (
    doc.key ||
    doc.cover_edition_key ||
    `${doc.title}-${doc.first_publish_year || ""}`
  );
}

function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }, [key, value]);
  return [value, setValue];
}

export default function App() {
  const [query, setQuery] = useState("");
  const [author, setAuthor] = useState("");
  const [sort, setSort] = useState("relevance");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [docs, setDocs] = useState([]);
  const [numFound, setNumFound] = useState(0);
  const [selected, setSelected] = useState(null);
  const [saved, setSaved] = useLocalStorage("bf_saved", {});

  const formRef = useRef(null);

  async function searchBooks({ pageOverride } = {}) {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError("");
    try {
      const pageToUse = pageOverride || page;
      const url = new URL("https://openlibrary.org/search.json");
      url.searchParams.set("title", q);
      if (author.trim()) url.searchParams.set("author", author.trim());
      url.searchParams.set("page", String(pageToUse));
      url.searchParams.set("limit", String(LIMIT));
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setDocs(data.docs || []);
      setNumFound(data.numFound || 0);
    } catch (e) {
      setError("Something went wrong. There was a network or API error.");
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    setPage(1);
    searchBooks({ pageOverride: 1 });
  }

  function toggleSave(doc) {
    const k = toBookKey(doc);
    setSaved((prev) => {
      const next = { ...prev };
      if (next[k]) delete next[k];
      else
        next[k] = {
          key: k,
          title: doc.title,
          author: (doc.author_name && doc.author_name[0]) || "Unknown",
          year: doc.first_publish_year || null,
          cover: buildCoverUrl(doc, "M"),
          work: doc.key || null,
        };
      return next;
    });
  }

  const savedList = useMemo(() => Object.values(saved), [saved]);

  const sortedDocs = useMemo(() => {
    const arr = [...docs];
    if (sort === "year_desc") {
      arr.sort(
        (a, b) => (b.first_publish_year || 0) - (a.first_publish_year || 0)
      );
    } else if (sort === "year_asc") {
      arr.sort(
        (a, b) => (a.first_publish_year || 0) - (b.first_publish_year || 0)
      );
    } else if (sort === "title_asc") {
      arr.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    }
    return arr;
  }, [docs, sort]);

  const totalPages = Math.max(1, Math.ceil(numFound / LIMIT));

  function gotoPage(p) {
    const clamped = Math.min(Math.max(1, p), totalPages);
    setPage(clamped);
    searchBooks({ pageOverride: clamped });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  useEffect(() => {
    // Run an example on first load for demo UX
    if (docs.length === 0 && !query) {
      setQuery("Harry Potter");
      setTimeout(() => {
        formRef.current?.dispatchEvent(
          new Event("submit", { cancelable: true, bubbles: true })
        );
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <header className="bg-indigo-600 text-white">
        <div className="container-narrow py-6">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            📚 Book Finder
          </h1>
          <p className="mt-2 text-white/90 max-w-2xl">
            Search for books on Open Library — by title, author, or year. You
            can save the results.
          </p>
        </div>
      </header>

      <main className="container-narrow py-6 space-y-6">
        <form ref={formRef} onSubmit={onSubmit} className="card p-4 md:p-6">
          <div className="grid md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-5">
              <label className="block text-sm font-medium text-slate-700">
                Title
              </label>
              <input
                type="text"
                className="mt-1 block w-full rounded-xl border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="e.g., Atomic Habits"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-slate-700">
                Author (optional)
              </label>
              <input
                type="text"
                className="mt-1 block w-full rounded-xl border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="e.g., James Clear"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700">
                Sort
              </label>
              <select
                className="mt-1 block w-full rounded-xl border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="relevance">Relevance</option>
                <option value="year_desc">Newest first</option>
                <option value="year_asc">Oldest first</option>
                <option value="title_asc">Title A→Z</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 font-medium"
                disabled={!query.trim() || loading}
              >
                {loading ? "Searching..." : "Search"}
              </button>
            </div>
          </div>
          <div className="mt-3 text-sm text-slate-600 flex flex-wrap gap-2">
            <span className="mr-2">Quick examples:</span>
            {[
              "Harry Potter",
              "Atomic Habits",
              "Pride and Prejudice",
              "Wings of Fire",
            ].map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => {
                  setQuery(ex);
                  setAuthor("");
                  setPage(1);
                }}
                className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200"
              >
                {ex}
              </button>
            ))}
          </div>
        </form>

        <section className="grid md:grid-cols-12 gap-6">
          <div className="md:col-span-9 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">
                Results {numFound ? `(${numFound.toLocaleString()})` : ""}
              </h2>
              {numFound > 0 && (
                <div className="text-sm text-slate-600">
                  Page {page} / {totalPages}
                </div>
              )}
            </div>

            {error && (
              <div className="card p-4 border-red-200 bg-red-50 text-red-700">
                {error}
              </div>
            )}

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="card p-4 animate-pulse">
                      <div className="h-40 bg-slate-200 rounded-xl" />
                      <div className="mt-3 h-6 w-2/3 bg-slate-200 rounded" />
                      <div className="mt-2 h-5 w-1/2 bg-slate-200 rounded" />
                    </div>
                  ))
                : sortedDocs.map((doc) => (
                    <div
                      key={toBookKey(doc)}
                      className="card overflow-hidden hover:shadow-lg transition"
                    >
                      <div
                        className="aspect-[3/4] bg-slate-100 relative"
                        onClick={() => setSelected(doc)}
                        role="button"
                        title="View details"
                      >
                        {buildCoverUrl(doc) ? (
                          <img
                            src={buildCoverUrl(doc)}
                            alt={doc.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 grid place-items-center text-slate-400">
                            No cover
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="font-semibold line-clamp-2">
                          {doc.title}
                        </div>
                        <div className="text-sm text-slate-600 mt-1">
                          {(doc.author_name && doc.author_name[0]) ||
                            "Unknown author"}
                          {doc.first_publish_year
                            ? ` • ${doc.first_publish_year}`
                            : ""}
                        </div>
                        <div className="mt-3 flex gap-2">
                          <a
                            href={`https://openlibrary.org${doc.key}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-900 text-white text-sm hover:bg-slate-800"
                          >
                            Open Library
                          </a>
                          <button
                            onClick={() => toggleSave(doc)}
                            className={`inline-flex items-center px-3 py-1.5 rounded-lg border text-sm ${
                              saved[toBookKey(doc)]
                                ? "bg-amber-100 border-amber-300 text-amber-900"
                                : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {saved[toBookKey(doc)] ? "Saved" : "Save"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
            </div>

            {!loading && !error && sortedDocs.length === 0 && (
              <div className="card p-6 text-slate-600">
                Search and the results will be shown here. You can try the
                examples given above.
              </div>
            )}

            {numFound > 0 && (
              <div className="flex items-center justify-between gap-2 pt-2">
                <button
                  className="px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50"
                  onClick={() => gotoPage(page - 1)}
                  disabled={page <= 1 || loading}
                >
                  ← Prev
                </button>
                <div className="text-sm text-slate-600">
                  Showing {(page - 1) * LIMIT + 1}–
                  {Math.min(page * LIMIT, numFound)} of{" "}
                  {numFound.toLocaleString()}
                </div>
                <button
                  className="px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50"
                  onClick={() => gotoPage(page + 1)}
                  disabled={page >= totalPages || loading}
                >
                  Next →
                </button>
              </div>
            )}
          </div>

          <aside className="md:col-span-3 space-y-4">
            <div className="card p-4">
              <h3 className="font-semibold text-slate-800">Saved</h3>
              {savedList.length === 0 ? (
                <p className="text-sm text-slate-600 mt-2">
                  There is no saved book right now.
                </p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {savedList.map((b) => (
                    <li key={b.key} className="flex gap-3">
                      <div className="w-12 h-16 bg-slate-100 rounded overflow-hidden flex-none">
                        {b.cover ? (
                          <img
                            src={b.cover}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          {b.title}
                        </div>
                        <div className="text-xs text-slate-600 truncate">
                          {b.author}
                        </div>
                        {b.year && (
                          <div className="text-xs text-slate-500">
                            ({b.year})
                          </div>
                        )}
                        {b.work && (
                          <a
                            href={`https://openlibrary.org${b.work}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-block mt-1 text-xs text-indigo-700 hover:underline"
                          >
                            View
                          </a>
                        )}
                      </div>
                      <button
                        onClick={() =>
                          setSaved((prev) => {
                            const n = { ...prev };
                            delete n[b.key];
                            return n;
                          })
                        }
                        className="ml-auto self-start text-xs text-slate-500 hover:text-red-600"
                        title="Remove"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="card p-4">
              <h3 className="font-semibold text-slate-800">About</h3>
              <p className="text-sm text-slate-600 mt-2">
                Data: Open Library Search API. Covers from
                covers.openlibrary.org.
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Tip: The author field is optional. Sorting is local. Saved items
                are stored in the browser.
              </p>
            </div>
          </aside>
        </section>
      </main>

      {selected && (
        <div
          className="fixed inset-0 bg-black/40 grid place-items-center p-4 z-50"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid md:grid-cols-2">
              <div className="bg-slate-100 aspect-[3/4]">
                {buildCoverUrl(selected, "L") ? (
                  <img
                    src={buildCoverUrl(selected, "L")}
                    alt={selected.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full grid place-items-center text-slate-400">
                    No cover
                  </div>
                )}
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold">{selected.title}</h3>
                <div className="text-slate-700 mt-1">
                  {(selected.author_name && selected.author_name.join(", ")) ||
                    "Unknown author"}
                </div>
                {selected.first_publish_year && (
                  <div className="text-slate-600 mt-1">
                    First published: {selected.first_publish_year}
                  </div>
                )}
                {selected.subject && (
                  <div className="mt-3">
                    <div className="text-sm font-medium text-slate-700 mb-1">
                      Subjects
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selected.subject.slice(0, 10).map((s) => (
                        <span
                          key={s}
                          className="px-2 py-0.5 rounded-full bg-slate-100 text-xs text-slate-700"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mt-4 flex gap-2">
                  <a
                    href={`https://openlibrary.org${selected.key}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg bg-slate-900 text-white px-4 py-2 hover:bg-slate-800"
                  >
                    Open Library
                  </a>
                  <button
                    onClick={() => toggleSave(selected)}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 hover:bg-slate-50"
                  >
                    {saved[toBookKey(selected)] ? "Saved ✓" : "Save"}
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="absolute top-3 right-3 bg-white/70 hover:bg-white rounded-full px-3 py-1 text-sm"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
