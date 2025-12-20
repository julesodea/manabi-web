"use client";

import { useState, useEffect, useRef, Suspense, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { useKanjiInfinite, useKanjiCount } from "@/lib/hooks/useKanji";

const JLPT_LEVELS = ["All", "N5", "N4", "N3", "N2", "N1"];

function KanjiGridContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectionModeParam = searchParams.get("select") === "true";

  const [selectedLevel, setSelectedLevel] = useState("All");
  const [selectedKanji, setSelectedKanji] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(selectionModeParam);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const observerTarget = useRef<HTMLDivElement>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // TanStack Query hooks
  const { data: totalCount } = useKanjiCount(selectedLevel);
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useKanjiInfinite({
    query: debouncedSearchQuery || undefined,
    jlptLevel: selectedLevel,
  });

  // Flatten paginated data
  const displayedKanji = useMemo(() => {
    return data?.pages.flatMap((page) => page.items) ?? [];
  }, [data]);

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

  // Create collection with selected kanji
  const createCollection = () => {
    const ids = Array.from(selectedKanji).join(",");
    router.push(`/collections/create?characterIds=${encodeURIComponent(ids)}`);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/"
                className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block"
              >
                Back to Home
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Browse Kanji</h1>
              <p className="text-gray-600 mt-1">
                {selectionMode ? (
                  <span>{selectedKanji.size} selected</span>
                ) : isLoading ? (
                  "Loading..."
                ) : searchQuery ? (
                  `${displayedKanji.length} kanji found`
                ) : totalCount ? (
                  `${totalCount} kanji`
                ) : (
                  `${displayedKanji.length} kanji`
                )}
              </p>
            </div>
            <div className="flex gap-2">
              {selectionMode && selectedKanji.size > 0 && (
                <Button variant="primary" onClick={createCollection}>
                  Create Collection ({selectedKanji.size})
                </Button>
              )}
              <Button
                variant={selectionMode ? "secondary" : "ghost"}
                onClick={() => setSelectionMode(!selectionMode)}
              >
                {selectionMode ? "Cancel Selection" : "Select Kanji"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by character, meaning, or reading..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-900 placeholder:text-gray-500"
            />
            <div className="flex gap-2 overflow-x-auto">
              {JLPT_LEVELS.map((level) => (
                <Button
                  key={level}
                  variant={selectedLevel === level ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedLevel(level)}
                >
                  {level}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Kanji Grid */}
      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <LoadingSkeleton count={15} />
        ) : displayedKanji.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <p className="text-gray-600 mb-4">
              {searchQuery
                ? "No kanji found matching your search."
                : "No kanji found for this level."}
            </p>
            <p className="text-sm text-gray-500">
              {searchQuery
                ? "Try a different search term"
                : "Make sure data is loaded with: npm run load-data"}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {displayedKanji.map((k) => {
                const isSelected = selectedKanji.has(k.id);
                const cardClassName = `aspect-square bg-white border-2 rounded-lg transition-all duration-200 flex flex-col items-center justify-center p-4 group relative ${
                  isSelected
                    ? "border-blue-600 bg-blue-50 ring-2 ring-blue-600"
                    : "border-gray-200"
                }`;

                const cardContent = (
                  <>
                    {selectionMode && isSelected && (
                      <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center">
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}
                    <div
                      className={`text-6xl mb-2 transition-transform ${
                        isSelected ? "text-blue-900" : "text-gray-700"
                      }`}
                    >
                      {k.character}
                    </div>
                    <div className="text-center">
                      <p className="capitalize text-xs text-gray-600 line-clamp-2">
                        {k.kanjiData.meanings.slice(0, 2).join(", ")}
                      </p>
                      <span className="text-xs text-blue-600 font-medium mt-1 inline-block">
                        {k.kanjiData.jlptLevel}
                      </span>
                    </div>
                  </>
                );

                return selectionMode ? (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => toggleKanji(k.id)}
                    className={cardClassName}
                  >
                    {cardContent}
                  </button>
                ) : (
                  <Link
                    key={k.id}
                    href={`/kanji/${k.id}`}
                    className={cardClassName}
                  >
                    {cardContent}
                  </Link>
                );
              })}
            </div>

            {/* Loading indicator and scroll trigger */}
            <div ref={observerTarget} className="py-8 text-center">
              {isFetchingNextPage && (
                <div className="text-gray-600">Loading more kanji...</div>
              )}
              {!hasNextPage && totalCount && totalCount > 0 && (
                <div className="text-gray-500 text-sm">
                  All {totalCount} kanji loaded!
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Floating action button for selection mode */}
      {selectionMode && selectedKanji.size > 0 && (
        <div className="fixed bottom-8 right-8">
          <Button
            variant="primary"
            size="lg"
            onClick={createCollection}
            className="shadow-2xl"
          >
            Create Collection ({selectedKanji.size})
          </Button>
        </div>
      )}
    </div>
  );
}

export default function KanjiGridPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-6xl animate-pulse">学</div>
        </div>
      }
    >
      <KanjiGridContent />
    </Suspense>
  );
}
