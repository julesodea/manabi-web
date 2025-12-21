"use client";

import { useState, useEffect, useRef, Suspense, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useKanjiInfinite, useKanjiCount } from "@/lib/hooks/useKanji";

const JLPT_LEVELS = [
  { label: "All", value: "All" },
  { label: "N5", value: "N5" },
  { label: "N4", value: "N4" },
  { label: "N3", value: "N3" },
  { label: "N2", value: "N2" },
  { label: "N1", value: "N1" },
];

function KanjiGridContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectionModeParam = searchParams.get("select") === "true";

  const [selectedLevel, setSelectedLevel] = useState("All");
  const [selectedKanji, setSelectedKanji] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(selectionModeParam);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle scroll for sticky header shadow
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // TanStack Query hooks
  const { data: totalCount } = useKanjiCount(selectedLevel);
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useKanjiInfinite({
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

  // Let browser handle scroll restoration
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.history.scrollRestoration = "auto";
    }
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 bg-white transition-all duration-300 ${
          scrolled ? "shadow-md py-3" : "py-4 border-b border-gray-100"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center text-white font-bold">
                学
              </div>
              <span className="text-rose-500 text-xl font-bold tracking-tight hidden sm:block">
                Manabi
              </span>
            </Link>

            {/* Search Bar */}
            <div className="hidden md:flex items-center bg-white border border-gray-300 rounded-full shadow-sm hover:shadow-md transition-shadow duration-200 w-full max-w-md mx-4">
              <input
                type="text"
                placeholder="Search meanings, readings..."
                className="flex-grow bg-transparent border-none outline-none px-6 py-2.5 text-sm font-medium placeholder-gray-500 rounded-l-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="pr-2 py-1">
                <div className="p-2 bg-rose-500 rounded-full text-white">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={3}
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
            </div>

            {/* Mobile Search */}
            <div className="md:hidden">
              <input
                type="text"
                placeholder="Search..."
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-full text-gray-700"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Right Menu */}
            <div className="flex items-center gap-2">
              {selectionMode ? (
                <>
                  {selectedKanji.size > 0 && (
                    <button
                      onClick={createCollection}
                      className="hidden sm:block px-4 py-2 bg-rose-500 text-white rounded-full text-sm font-medium hover:bg-rose-600 transition"
                    >
                      Create Collection ({selectedKanji.size})
                    </button>
                  )}
                  <button
                    onClick={() => setSelectionMode(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-full text-sm font-medium hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setSelectionMode(true)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-full text-sm font-medium hover:bg-gray-50 transition"
                >
                  Select
                </button>
              )}
            </div>
          </div>

          {/* Categories Bar */}
          <div className="mt-4 flex items-center gap-6 overflow-x-auto no-scrollbar pb-2">
            {JLPT_LEVELS.map((level) => (
              <button
                key={level.value}
                onClick={() => setSelectedLevel(level.value)}
                className={`flex flex-col items-center gap-1 min-w-[48px] cursor-pointer group transition-all duration-200 pb-2 border-b-2 ${
                  selectedLevel === level.value
                    ? "opacity-100 text-black border-black"
                    : "opacity-60 text-gray-500 hover:opacity-100 border-transparent"
                }`}
              >
                <span className="text-xs font-medium whitespace-nowrap">
                  {level.label}
                </span>
              </button>
            ))}
            <div className="ml-auto text-sm text-gray-500">
              {isLoading
                ? "Loading..."
                : searchQuery
                ? `${displayedKanji.length} found`
                : totalCount
                ? `${totalCount} kanji`
                : ""}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 pb-20">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {[...Array(15)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-gray-100 rounded-xl mb-3"></div>
                <div className="h-4 bg-gray-100 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : displayedKanji.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-900">No Kanji found</h3>
            <p className="text-gray-500 mt-2">
              Try changing your filters or search terms.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedLevel("All");
              }}
              className="mt-6 px-6 py-2 border border-black rounded-lg hover:bg-gray-100 transition font-medium"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {displayedKanji.map((k) => {
                const isSelected = selectedKanji.has(k.id);

                const cardContent = (
                  <div className="group cursor-pointer">
                    {/* Card Image Area */}
                    <div
                      className={`relative aspect-square bg-gray-50 rounded-xl overflow-hidden mb-3 border transition-all duration-300 ${
                        isSelected
                          ? "border-rose-500 ring-2 ring-rose-500 bg-rose-50"
                          : "border-gray-100 group-hover:shadow-lg"
                      }`}
                    >
                      {/* Selection Indicator */}
                      {selectionMode && isSelected && (
                        <div className="absolute top-3 right-3 z-10 bg-rose-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
                          <svg
                            className="w-4 h-4"
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
                        <span
                          className={`text-7xl sm:text-8xl ${
                            isSelected ? "text-rose-900" : "text-gray-800"
                          }`}
                        >
                          {k.character}
                        </span>
                      </div>

                      {/* Level Badge */}
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm border border-gray-100 text-xs font-bold text-gray-800">
                        {k.kanjiData.jlptLevel}
                      </div>
                    </div>

                    {/* Card Details */}
                    <div>
                      <h3 className="font-semibold text-gray-900 truncate">
                        {k.kanjiData.meanings.slice(0, 2).join(", ")}
                      </h3>
                      <p className="text-gray-500 text-sm mt-0.5 truncate">
                        {k.kanjiData.readings.onyomi.slice(0, 2).join(", ") ||
                          k.kanjiData.readings.kunyomi.slice(0, 2).join(", ")}
                      </p>
                    </div>
                  </div>
                );

                return selectionMode ? (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => toggleKanji(k.id)}
                    className="text-left"
                  >
                    {cardContent}
                  </button>
                ) : (
                  <Link key={k.id} href={`/kanji/${k.id}`}>
                    {cardContent}
                  </Link>
                );
              })}
            </div>

            {/* Loading indicator and scroll trigger */}
            <div ref={observerTarget} className="py-8 text-center">
              {isFetchingNextPage && (
                <div className="text-gray-500">Loading more...</div>
              )}
              {!hasNextPage && totalCount && totalCount > 0 && (
                <div className="text-gray-400 text-sm">
                  All {totalCount} kanji loaded
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Floating Action Button */}
      {selectionMode && selectedKanji.size > 0 && (
        <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-40">
          <button
            onClick={createCollection}
            className="bg-gray-900 hover:scale-105 active:scale-95 transition-all text-white px-6 py-3 rounded-full shadow-xl font-medium flex items-center gap-2"
          >
            Create Collection ({selectedKanji.size})
          </button>
        </div>
      )}
    </div>
  );
}

export default function KanjiGridPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-6xl animate-pulse">学</div>
        </div>
      }
    >
      <KanjiGridContent />
    </Suspense>
  );
}
