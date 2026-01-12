"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCreateCollection } from "@/lib/hooks/useCollections";
import { useKanjiInfinite, useKanjiCount } from "@/lib/hooks/useKanji";
import { StudyMode } from "@/types";
import { useTheme } from "@/lib/providers/ThemeProvider";

const JLPT_LEVELS = ["All", "N5", "N4", "N3", "N2", "N1"];

function CreateCollectionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const createCollection = useCreateCollection();
  const { colors } = useTheme();

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
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useKanjiInfinite({
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
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 duration-300 ${
          scrolled ? "shadow-xl py-3" : "py-4 shadow-lg"
        }`}
        style={{
          background: `linear-gradient(to right, ${colors.primary}, ${colors.primaryDark})`,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-bold">
                  学
                </div>
                <span className="text-white text-xl font-bold tracking-tight hidden sm:block">
                  Manabi
                </span>
              </Link>
              <div className="hidden sm:block h-6 w-px bg-white/30" />
              <h1 className="text-lg font-semibold text-white hidden sm:block">
                Create Collection
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm text-white/80">Selected</div>
                <div className="text-xl font-bold text-white">
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
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                style={{
                  ['--tw-ring-color' as string]: `${colors.primary}33`,
                }}
                placeholder="Collection Name *"
                required
              />
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                style={{
                  ['--tw-ring-color' as string]: `${colors.primary}33`,
                }}
                placeholder="Description (optional)"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStudyMode("flashcard")}
                className={`flex-1 px-4 py-3 border-2 rounded-xl transition-colors font-medium ${
                  studyMode === "flashcard"
                    ? ""
                    : "border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
                style={
                  studyMode === "flashcard"
                    ? {
                        borderColor: colors.primary,
                        backgroundColor: colors.primaryLight,
                        color: colors.primaryDark,
                      }
                    : undefined
                }
              >
                Flashcard
              </button>
              <button
                type="button"
                onClick={() => setStudyMode("multiple_choice")}
                className={`flex-1 px-4 py-3 border-2 rounded-xl transition-colors font-medium ${
                  studyMode === "multiple_choice"
                    ? ""
                    : "border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
                style={
                  studyMode === "multiple_choice"
                    ? {
                        borderColor: colors.primary,
                        backgroundColor: colors.primaryLight,
                        color: colors.primaryDark,
                      }
                    : undefined
                }
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
                className="flex-1 px-4 py-3 text-white rounded-full font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: `linear-gradient(to right, ${colors.primary}, ${colors.primaryDark})`,
                }}
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
            <div className="flex items-center bg-white border border-gray-300 rounded-full duration-200 flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Kanji by character, meaning..."
                className="grow bg-transparent border-none outline-none focus:outline-none focus:ring-0 px-6 py-2.5 text-sm font-medium placeholder-gray-500 rounded-l-full text-gray-700"
              />
              <div className="pr-2 py-1">
                <div
                  className="p-2 rounded-full text-white"
                  style={{
                    background: `linear-gradient(to right, ${colors.primary}, ${colors.primaryDark})`,
                  }}
                >
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
                      ? "text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  style={
                    selectedLevel === level
                      ? {
                          background: `linear-gradient(to right, ${colors.primary}, ${colors.primaryDark})`,
                        }
                      : undefined
                  }
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
            <p className="text-gray-600">Loading Kanji...</p>
          </div>
        ) : displayedKanji.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl">
            <p className="text-gray-600 mb-2">No Kanji found</p>
            <p className="text-sm text-gray-500">
              Try a different search or filter
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-500">
              Showing {displayedKanji.length} of {totalCount ?? 0} Kanji
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {displayedKanji.map((k) => {
                const isSelected = selectedKanji.has(k.id);
                return (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => toggleKanji(k.id)}
                    className={`border rounded-xl duration-200 flex flex-col p-3 group relative ${
                      isSelected ? "ring-2" : "bg-gray-50 border-gray-100"
                    }`}
                    style={
                      isSelected
                        ? {
                            borderColor: colors.primary,
                            backgroundColor: colors.primaryLight,
                            boxShadow: `0 0 0 2px ${colors.primary}`,
                          }
                        : undefined
                    }
                  >
                    {isSelected && (
                      <div
                        className="absolute top-2 right-2 text-white rounded-full w-5 h-5 flex items-center justify-center"
                        style={{
                          background: `linear-gradient(to right, ${colors.primary}, ${colors.primaryDark})`,
                        }}
                      >
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

                    {/* Kanji Character */}
                    <div className="flex items-center justify-center mb-2">
                      <div
                        className="text-6xl"
                        style={
                          isSelected
                            ? { color: colors.primaryDark }
                            : { color: "#1F2937" }
                        }
                      >
                        {k.character}
                      </div>
                    </div>

                    {/* JLPT Level Badge */}
                    <div className="mb-2">
                      <span className="inline-block px-2 py-0.5 bg-white/90 rounded text-xs font-semibold text-gray-700 border border-gray-200">
                        {k.kanjiData.jlptLevel}
                      </span>
                    </div>

                    {/* Meanings */}
                    <div className="mb-2">
                      <p className="text-xs font-semibold text-gray-900 truncate">
                        {k.kanjiData.meanings.slice(0, 2).map((m, i) => (
                          <span key={i}>
                            {i > 0 && ", "}
                            {m.charAt(0).toUpperCase() + m.slice(1)}
                          </span>
                        ))}
                      </p>
                    </div>

                    {/* Readings */}
                    <div className="text-xs text-gray-600 space-y-0.5">
                      {k.kanjiData.readings.onyomi.length > 0 && (
                        <p className="truncate">
                          <span className="font-medium">On: </span>
                          {k.kanjiData.readings.onyomi.slice(0, 2).join("、")}
                        </p>
                      )}
                      {k.kanjiData.readings.kunyomi.length > 0 && (
                        <p className="truncate">
                          <span className="font-medium">Kun: </span>
                          {k.kanjiData.readings.kunyomi.slice(0, 2).join("、")}
                        </p>
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
