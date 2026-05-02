// DocSearch AI - Frontend (React + Tailwind)
// AI & Cloud Computing Internship Project

import { useState, useEffect, useRef } from "react";

const API_BASE = "http://localhost:5000/api";

// ─── Utility ───
const scoreColor = (s) => s >= 0.9 ? "#22d3a0" : s >= 0.7 ? "#f59e0b" : "#f87171";
const typeEmoji = { PDF: "📄", DOCX: "📝", TXT: "📃", PPT: "📊" };

export default function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState("all");
  const [selectedDoc, setSelectedDoc] = useState(null);
  const inputRef = useRef();

  // Fetch system stats on mount
  useEffect(() => {
    fetch(`${API_BASE}/stats`)
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResults([]);
    setSelectedDoc(null);
    try {
      const url = `${API_BASE}/search?q=${encodeURIComponent(query)}&type=${filter}&limit=10`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      setResults(data.results || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-lg">🔍</div>
          <h1 className="text-lg font-bold tracking-tight">
            DocSearch <span className="text-indigo-400 font-mono text-xs border border-indigo-700 bg-indigo-900/50 px-2 py-0.5 rounded ml-1">AI</span>
          </h1>
        </div>
        {stats && (
          <div className="ml-auto flex gap-4 text-xs text-gray-400 font-mono">
            <span className="text-emerald-400">{stats.total_documents} docs indexed</span>
            <span>{stats.embedding_dimensions}d embeddings</span>
            <span className="text-emerald-400">● Online</span>
          </div>
        )}
      </header>

      {/* Search bar */}
      <div className="px-6 pt-10 pb-6 max-w-3xl mx-auto w-full">
        <form onSubmit={handleSearch} className="relative">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Search semantically... e.g. "how does gradient descent work"'
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-5 py-4 pr-28 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
          >
            {loading ? "Searching..." : "Search →"}
          </button>
        </form>

        {/* Filters */}
        <div className="flex gap-2 mt-3 flex-wrap">
          {["all", "PDF", "DOCX", "PPT", "TXT"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                filter === f
                  ? "bg-indigo-600/20 border-indigo-500 text-indigo-300"
                  : "border-gray-700 text-gray-400 hover:border-gray-500"
              }`}
            >
              {f === "all" ? "All Types" : f}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <main className="flex-1 px-6 pb-12 max-w-3xl mx-auto w-full">
        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-300 rounded-xl px-5 py-3 text-sm mb-4">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-3 text-indigo-400 text-sm font-mono mb-4">
            <div className="w-4 h-4 border-2 border-indigo-600 border-t-indigo-300 rounded-full animate-spin" />
            Running semantic search...
          </div>
        )}

        {results.length > 0 && (
          <>
            <p className="text-xs text-gray-500 mb-4">
              Found <span className="text-gray-200 font-semibold">{results.length}</span> documents matching your query
            </p>
            <div className="space-y-3">
              {results.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc.id === selectedDoc?.id ? null : doc)}
                  className={`bg-gray-900 border rounded-xl px-5 py-4 cursor-pointer transition hover:border-indigo-500/50 hover:-translate-y-0.5 ${
                    selectedDoc?.id === doc.id ? "border-indigo-500" : "border-gray-800"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{typeEmoji[doc.type] || "📄"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm truncate">{doc.title}</h3>
                        <span
                          className="ml-auto text-xs font-mono font-medium px-2 py-0.5 rounded border flex-shrink-0"
                          style={{
                            color: scoreColor(doc.score),
                            borderColor: scoreColor(doc.score) + "44",
                            background: scoreColor(doc.score) + "11",
                          }}
                        >
                          {Math.round(doc.score * 100)}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mb-2">{doc.snippet}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {doc.tags.map((t) => (
                          <span key={t} className="text-xs bg-indigo-900/40 text-indigo-300 border border-indigo-800 rounded px-2 py-0.5 font-mono">
                            {t}
                          </span>
                        ))}
                        <span className="ml-auto text-xs text-gray-600 font-mono">{doc.date}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {!loading && results.length === 0 && !error && (
          <div className="text-center py-24 text-gray-500">
            <div className="text-5xl mb-4 opacity-30">🔭</div>
            <p>Enter a query to search across all indexed documents<br />using AI-powered semantic understanding</p>
          </div>
        )}
      </main>
    </div>
  );
}
