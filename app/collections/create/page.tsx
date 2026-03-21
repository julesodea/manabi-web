"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCreateCollection } from "@/lib/hooks/useCollections";
import { useKanjiInfinite, useKanjiCount } from "@/lib/hooks/useKanji";
import { useInfiniteScroll } from "@/lib/hooks/useInfiniteScroll";
import { StudyMode } from "@/types";
import MinimalHeader from "@/components/MinimalHeader";
import MenuDrawer from "@/components/MenuDrawer";
import { useTheme } from "@/lib/providers/ThemeProvider";

const JLPT_LEVELS = ["All", "N5", "N4", "N3", "N2", "N1"];

const JLPT_BADGE: Record<string, { light: string; dark: string }> = {
  N5: {
    light: "bg-emerald-100 text-emerald-700",
    dark: "bg-emerald-900/60 text-emerald-400",
  },
  N4: {
    light: "bg-amber-100 text-amber-700",
    dark: "bg-amber-900/60 text-yellow-300",
  },
  N3: {
    light: "bg-violet-100 text-violet-700",
    dark: "bg-violet-900/60 text-violet-400",
  },
  N2: { light: "bg-sky-100 text-sky-700", dark: "bg-sky-900/60 text-sky-400" },
  N1: {
    light: "bg-rose-100 text-rose-700",
    dark: "bg-rose-900/60 text-rose-400",
  },
};

function CreateCollectionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const createCollection = useCreateCollection();
  const {
    colors: { isDark },
  } = useTheme();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [studyMode, setStudyMode] = useState<StudyMode>("flashcard");
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  // Kanji grid state
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [selectedKanji, setSelectedKanji] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: totalCount } = useKanjiCount(selectedLevel);
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useKanjiInfinite({
      query: debouncedSearchQuery,
      jlptLevel: selectedLevel,
    });

  const displayedKanji = data?.pages.flatMap((page) => page.items) ?? [];
  const observerTarget = useInfiniteScroll(fetchNextPage, hasNextPage, isFetchingNextPage);

  // Pre-fill from URL params
  useEffect(() => {
    const ids = searchParams.get("characterIds");
    if (ids) {
      const idArray = ids.split(",").map((id) => id.trim());
      setSelectedKanji(new Set(idArray));
    }
  }, [searchParams]);

  const toggleKanji = (id: string) => {
    setSelectedKanji((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const canCreate = name.trim().length > 0 && selectedKanji.size > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Collection name is required");
      return;
    }

    if (selectedKanji.size === 0) {
      setError("Please select at least one kanji");
      return;
    }

    try {
      await createCollection.mutateAsync({
        name: name.trim(),
        description: description.trim(),
        studyMode,
        characterIds: Array.from(selectedKanji),
      });

      router.push("/");
    } catch {
      setError("Failed to create collection. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <MenuDrawer isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <MinimalHeader showMenu menuOpen={menuOpen} onMenuClick={() => setMenuOpen(true)} />

      {/* Form Section */}
      <div className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold text-foreground mb-6">
            Create collection
          </h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-5 py-4 border border-border rounded-2xl focus:ring-2 focus:border-transparent text-foreground placeholder:text-muted/60 bg-card-bg text-base"
              placeholder="Collection name"
              required
            />
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-5 py-4 border border-border rounded-2xl focus:ring-2 focus:border-transparent text-foreground placeholder:text-muted/60 bg-card-bg text-base"
              placeholder="Description (optional)"
            />

            <div>
              <p className="text-sm font-medium text-muted mb-3">Study mode</p>
              <div className="inline-flex bg-card-bg rounded-xl border border-border p-1">
                <button
                  type="button"
                  onClick={() => setStudyMode("flashcard")}
                  className={`px-6 py-2.5 text-sm font-medium transition-colors rounded-lg ${
                    studyMode === "flashcard"
                      ? "bg-[var(--accent)] text-[var(--accent-text)]"
                      : "text-muted"
                  }`}
                >
                  Flashcard
                </button>
                <button
                  type="button"
                  onClick={() => setStudyMode("multiple_choice")}
                  className={`px-6 py-2.5 text-sm font-medium transition-colors rounded-lg ${
                    studyMode === "multiple_choice"
                      ? "bg-[var(--accent)] text-[var(--accent-text)]"
                      : "text-muted"
                  }`}
                >
                  Multiple choice
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="px-5 py-2 border-2 border-border text-foreground rounded-xl font-semibold hover:bg-card-bg transition text-base"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createCollection.isPending || !canCreate}
                className="px-5 py-2 bg-[var(--accent)] text-[var(--accent-text)] rounded-xl font-semibold disabled:opacity-40 disabled:cursor-not-allowed text-base shadow-md hover:shadow-lg transition"
              >
                {createCollection.isPending
                  ? "Creating..."
                  : `Create (${selectedKanji.size} selected)`}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="sticky top-[72px] z-40 w-[calc(100%-1rem)] max-w-[calc(80rem-2rem)] mx-auto inset-x-0">
        <div className="py-3">
          <div className="flex flex-col sm:flex-row gap-3 bg-background/80 backdrop-blur-xl rounded-2xl p-3 border border-border/50">
            <div className="flex items-center bg-card-bg border border-border rounded-xl shadow-sm flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search meanings, readings..."
                className="flex-1 min-w-0 bg-transparent border-none outline-none focus:outline-none focus:ring-0 px-4 py-2.5 text-sm font-medium placeholder:text-muted text-foreground"
              />
              <div className="pr-3 text-muted">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              {JLPT_LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setSelectedLevel(level)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                    selectedLevel === level
                      ? "bg-[var(--accent)] text-[var(--accent-text)]"
                      : "bg-card-bg text-foreground border border-border hover:bg-[var(--accent)]/10"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Kanji Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4 animate-pulse text-foreground">
              学
            </div>
            <p className="text-muted">Loading Kanji...</p>
          </div>
        ) : displayedKanji.length === 0 ? (
          <div className="text-center py-12 bg-card-bg border border-border rounded-xl">
            <p className="text-foreground mb-2">No Kanji found</p>
            <p className="text-sm text-muted">
              Try a different search or filter
            </p>
          </div>
        ) : (
          <>
            <div className="mb-3 text-sm text-muted">
              Showing {displayedKanji.length} of {totalCount ?? 0} kanji
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {displayedKanji.map((k) => {
                const isSelected = selectedKanji.has(k.id);
                const level = k.kanjiData.jlptLevel || "N5";
                const badgeColors = JLPT_BADGE[level] || JLPT_BADGE.N5;
                const badgeClass = isDark
                  ? badgeColors.dark
                  : badgeColors.light;

                return (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => toggleKanji(k.id)}
                    className={`relative rounded-xl border text-left transition-all duration-150 ${
                      isSelected
                        ? "border-[var(--accent)] ring-2 ring-[var(--accent)] bg-card-bg"
                        : "border-border bg-card-bg hover:shadow-md"
                    }`}
                  >
                    {/* JLPT pill */}
                    <div
                      className={`absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-bold ${badgeClass}`}
                    >
                      {level}
                    </div>

                    {/* Checkmark */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-[var(--accent)] rounded-full w-5 h-5 flex items-center justify-center text-[var(--accent-text)]">
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={3}
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}

                    {/* Kanji character */}
                    <div className="pt-8 pb-2 flex items-center justify-center">
                      <span className="text-5xl sm:text-6xl text-foreground">
                        {k.character}
                      </span>
                    </div>

                    {/* Meaning + readings */}
                    <div className="px-2.5 pb-2.5">
                      <p className="font-semibold text-foreground text-xs truncate">
                        {k.kanjiData.meanings.slice(0, 2).map((m, i) => (
                          <span key={i}>
                            {i > 0 && ", "}
                            {m.charAt(0).toUpperCase() + m.slice(1)}
                          </span>
                        ))}
                      </p>
                      <p className="text-muted text-[10px] truncate mt-0.5">
                        {[
                          k.kanjiData.readings.onyomi[0],
                          k.kanjiData.readings.kunyomi[0],
                        ]
                          .filter(Boolean)
                          .join("、")}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div ref={observerTarget} className="py-6 text-center">
              {isFetchingNextPage && (
                <div className="text-muted text-sm">Loading more...</div>
              )}
              {!hasNextPage && (totalCount ?? 0) > 0 && (
                <div className="text-muted text-sm">All kanji loaded</div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default function CreateCollectionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-6xl text-foreground animate-pulse">学</div>
        </div>
      }
    >
      <CreateCollectionForm />
    </Suspense>
  );
}
