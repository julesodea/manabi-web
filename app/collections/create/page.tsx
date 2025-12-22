"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCreateCollection } from "@/lib/hooks/useCollections";
import { useKanjiInfinite, useKanjiCount } from "@/lib/hooks/useKanji";
import { StudyMode } from "@/types";

const JLPT_LEVELS = ["All", "N5", "N4", "N3", "N2", "N1"];

function CreateCollectionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const createCollection = useCreateCollection();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [studyMode, setStudyMode] = useState<StudyMode>("flashcard");
  const [error, setError] = useState("");
  const [scrolled, setScrolled] = useState(false);

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
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useKanjiInfinite({
    query: debouncedSearchQuery,
    jlptLevel: selectedLevel,
  });

  // Flatten paginated data
  const displayedKanji = data?.pages.flatMap((page) => page.items) ?? [];

  // Handle scroll for sticky header shadow
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
      console.error("Create collection error:", err);
    }
  };

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
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center text-white font-bold">
                  学
                </div>
                <span className="text-rose-500 text-xl font-bold tracking-tight hidden sm:block">
                  Manabi
                </span>
              </Link>
              <div className="hidden sm:block h-6 w-px bg-gray-200" />
              <h1 className="text-lg font-semibold text-gray-900 hidden sm:block">
                Create Collection
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm text-gray-500">Selected</div>
                <div className="text-xl font-bold text-rose-500">
                  {selectedKanji.size}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Form Section */}
      <div className="pt-20 border-b border-gray-100 bg-gray-50">
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
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                placeholder="Collection Name *"
                required
              />
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                placeholder="Description (optional)"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStudyMode("flashcard")}
                className={`flex-1 px-4 py-3 border-2 rounded-xl transition-colors font-medium ${
                  studyMode === "flashcard"
                    ? "border-rose-500 bg-rose-50 text-rose-900"
                    : "border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                Flashcard
              </button>
              <button
                type="button"
                onClick={() => setStudyMode("multiple_choice")}
                className={`flex-1 px-4 py-3 border-2 rounded-xl transition-colors font-medium ${
                  studyMode === "multiple_choice"
                    ? "border-rose-500 bg-rose-50 text-rose-900"
                    : "border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                Multiple Choice
              </button>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-full font-medium hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  createCollection.isPending || selectedKanji.size === 0
                }
                className="flex-1 px-4 py-3 bg-rose-500 text-white rounded-full font-medium hover:bg-rose-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
      <div className="sticky top-[72px] z-40 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center bg-white border border-gray-300 rounded-full shadow-sm hover:shadow-md transition-shadow duration-200 flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search kanji by character, meaning..."
                className="grow bg-transparent border-none outline-none px-6 py-2.5 text-sm font-medium placeholder-gray-500 rounded-l-full text-gray-700"
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
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {JLPT_LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setSelectedLevel(level)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                    selectedLevel === level
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
            <div className="text-6xl mb-4 animate-pulse">学</div>
            <p className="text-gray-600">Loading kanji...</p>
          </div>
        ) : displayedKanji.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl">
            <p className="text-gray-600 mb-2">No kanji found</p>
            <p className="text-sm text-gray-500">
              Try a different search or filter
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-500">
              Showing {displayedKanji.length} of {totalCount ?? 0} kanji
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
              {displayedKanji.map((k) => {
                const isSelected = selectedKanji.has(k.id);
                return (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => toggleKanji(k.id)}
                    className={`aspect-square bg-gray-50 border rounded-xl transition-all duration-200 flex flex-col items-center justify-center p-2 group relative hover:shadow-md ${
                      isSelected
                        ? "border-rose-500 bg-rose-50 ring-2 ring-rose-500"
                        : "border-gray-100"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-1 right-1 bg-rose-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                        <svg
                          className="w-3 h-3"
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
                      className={`text-3xl mb-1 group-hover:scale-110 transition-transform ${
                        isSelected ? "text-rose-900" : "text-gray-800"
                      }`}
                    >
                      {k.character}
                    </div>
                    <div className="text-center w-full px-1 space-y-0.5">
                      {k.kanjiData.readings.onyomi[0] && (
                        <div className="text-[10px] text-gray-500 truncate">
                          {k.kanjiData.readings.onyomi[0]}
                        </div>
                      )}
                      {k.kanjiData.readings.kunyomi[0] && (
                        <div className="text-[10px] text-gray-400 truncate">
                          {k.kanjiData.readings.kunyomi[0]}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div ref={observerTarget} className="py-6 text-center">
              {isFetchingNextPage && (
                <div className="text-gray-500 text-sm">Loading more...</div>
              )}
              {!hasNextPage && (totalCount ?? 0) > 0 && (
                <div className="text-gray-400 text-sm">All kanji loaded</div>
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
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-6xl animate-pulse">学</div>
        </div>
      }
    >
      <CreateCollectionForm />
    </Suspense>
  );
}
