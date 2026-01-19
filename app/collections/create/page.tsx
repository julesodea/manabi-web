"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCreateCollection } from "@/lib/hooks/useCollections";
import { useKanjiInfinite, useKanjiCount } from "@/lib/hooks/useKanji";
import { StudyMode } from "@/types";
import MinimalHeader from "@/components/MinimalHeader";
import MenuDrawer from "@/components/MenuDrawer";

const JLPT_LEVELS = ["All", "N5", "N4", "N3", "N2", "N1"];

function CreateCollectionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const createCollection = useCreateCollection();

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
  const observerTarget = useRef<HTMLDivElement>(null);

  // Debounce search query (same as kanji grid)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Use the same hooks as kanji grid
  const { data: totalCount } = useKanjiCount(selectedLevel);
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useKanjiInfinite({
      query: debouncedSearchQuery,
      jlptLevel: selectedLevel,
    });

  // Flatten paginated data
  const displayedKanji = data?.pages.flatMap((page) => page.items) ?? [];

  // Pre-fill from URL params
  useEffect(() => {
    const ids = searchParams.get("characterIds");
    if (ids) {
      const idArray = ids.split(",").map((id) => id.trim());
      setSelectedKanji(new Set(idArray));
    }
  }, [searchParams]);

  // Toggle kanji selection
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

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

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
    } catch (err) {
      setError("Failed to create collection. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Menu Drawer */}
      <MenuDrawer isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Minimal Header */}
      <MinimalHeader
        showMenu
        onMenuClick={() => setMenuOpen(true)}
        title="Create Collection"
        rightContent={
          <div className="text-right">
            <div className="text-sm text-muted">Selected</div>
            <div className="text-xl font-bold text-foreground">
              {selectedKanji.size}
            </div>
          </div>
        }
      />

      {/* Form Section */}
      <div className="pt-20 border-b border-border bg-card-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="px-4 py-3 border border-border rounded-xl focus:ring-2 focus:border-transparent text-foreground placeholder:text-muted bg-background"
                placeholder="Collection Name *"
                required
              />
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="px-4 py-3 border border-border rounded-xl focus:ring-2 focus:border-transparent text-foreground placeholder:text-muted bg-background"
                placeholder="Description (optional)"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStudyMode("flashcard")}
                className={`flex-1 px-4 py-3 border-2 rounded-xl transition-colors font-medium ${
                  studyMode === "flashcard"
                    ? "border-[var(--accent)] bg-[var(--accent)]/10 text-foreground"
                    : "border-border text-foreground hover:bg-background"
                }`}
              >
                Flashcard
              </button>
              <button
                type="button"
                onClick={() => setStudyMode("multiple_choice")}
                className={`flex-1 px-4 py-3 border-2 rounded-xl transition-colors font-medium ${
                  studyMode === "multiple_choice"
                    ? "border-[var(--accent)] bg-[var(--accent)]/10 text-foreground"
                    : "border-border text-foreground hover:bg-background"
                }`}
              >
                Multiple Choice
              </button>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="flex-1 px-4 py-3 border border-border text-foreground rounded-full font-medium hover:bg-background transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  createCollection.isPending || selectedKanji.size === 0
                }
                className="flex-1 px-4 py-3 bg-[var(--accent)] text-[var(--accent-text)] rounded-full font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-shadow"
              >
                {createCollection.isPending
                  ? "Creating..."
                  : `Create (${selectedKanji.size})`}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="sticky top-[72px] z-40 bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center bg-card-bg border border-border rounded-xl shadow-sm flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search meanings, readings..."
                className="flex-1 min-w-0 bg-transparent border-none outline-none focus:outline-none focus:ring-0 px-4 py-3 text-sm font-medium placeholder:text-muted text-foreground"
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
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4 animate-pulse text-foreground">学</div>
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
            <div className="mb-4 text-sm text-muted">
              Showing {displayedKanji.length} of {totalCount ?? 0} Kanji
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {displayedKanji.map((k) => {
                const isSelected = selectedKanji.has(k.id);
                return (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => toggleKanji(k.id)}
                    className="group cursor-pointer"
                  >
                    <div className="bg-card-bg rounded-2xl overflow-hidden shadow-sm border border-border hover:shadow-md transition-all duration-200">
                      {/* Card Image Area */}
                      <div className="relative aspect-square duration-300 bg-card-bg border-b border-border">
                        {/* Selection Indicator */}
                        {isSelected && (
                          <div className="absolute top-3 right-3 z-10 bg-[var(--accent)] rounded-full w-7 h-7 flex items-center justify-center shadow-lg text-[var(--accent-text)]">
                            <svg
                              className="w-5 h-5"
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

                        {/* Kanji Character */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-7xl sm:text-8xl text-foreground">
                            {k.character}
                          </span>
                        </div>

                        {/* Level Badge */}
                        <div className="absolute top-3 left-3 bg-[var(--accent)]/10 px-2.5 py-1 rounded-lg shadow-sm text-xs font-bold text-[var(--accent)]">
                          {k.kanjiData.jlptLevel}
                        </div>
                      </div>

                      {/* Card Details */}
                      <div className="p-4">
                        <h3 className="font-semibold text-foreground truncate text-base">
                          {k.kanjiData.meanings.slice(0, 2).map((m, i) => (
                            <span key={i}>
                              {i > 0 && ", "}
                              {m.charAt(0).toUpperCase() + m.slice(1)}
                            </span>
                          ))}
                        </h3>
                        <p className="text-muted text-sm mt-1 truncate">
                          {[
                            k.kanjiData.readings.onyomi[0],
                            k.kanjiData.readings.kunyomi[0],
                          ]
                            .filter(Boolean)
                            .join("、")}
                        </p>
                      </div>
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
