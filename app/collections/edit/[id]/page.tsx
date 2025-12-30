"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useCollection, useUpdateCollection } from "@/lib/hooks/useCollections";
import { StudyMode } from "@/types";

interface KanjiWithData {
  id: string;
  character: string;
  kanjiData: {
    meanings: string[];
    jlptLevel: string;
    readings: {
      onyomi: string[];
      kunyomi: string[];
    };
  };
}

const JLPT_LEVELS = ["All", "N5", "N4", "N3", "N2", "N1"];
const PAGE_SIZE = 50;

function EditCollectionForm() {
  const router = useRouter();
  const params = useParams();
  const collectionId = params.id as string;

  const { data: collection, isLoading: loadingCollection } =
    useCollection(collectionId);
  const updateCollection = useUpdateCollection();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [studyMode, setStudyMode] = useState<StudyMode>("flashcard");
  const [error, setError] = useState("");
  const [scrolled, setScrolled] = useState(false);

  // Kanji grid state
  const [displayedKanji, setDisplayedKanji] = useState<KanjiWithData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedKanji, setSelectedKanji] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const observerTarget = useRef<HTMLDivElement>(null);

  // Handle scroll for sticky header shadow
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Pre-fill form with existing collection data
  useEffect(() => {
    if (collection) {
      setName(collection.name);
      setDescription(collection.description);
      setStudyMode(collection.studyMode);
      setSelectedKanji(new Set(collection.characterIds));
    }
  }, [collection]);

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

  // Fetch kanji
  useEffect(() => {
    async function fetchInitialKanji() {
      setLoading(true);
      setDisplayedKanji([]);
      setHasMore(true);
      try {
        const levelParam =
          selectedLevel !== "All" ? `jlptLevel=${selectedLevel}` : "";
        const [countResponse, dataResponse] = await Promise.all([
          fetch(`/api/kanji/count${levelParam ? `?${levelParam}` : ""}`),
          fetch(
            `/api/kanji?${levelParam}${
              levelParam ? "&" : ""
            }limit=${PAGE_SIZE}&offset=0`
          ),
        ]);

        if (countResponse.ok) {
          const { count } = await countResponse.json();
          setTotalCount(count);
        }

        if (dataResponse.ok) {
          const data = await dataResponse.json();
          setDisplayedKanji(data);
          setHasMore(data.length === PAGE_SIZE);
        }
      } catch (error) {
        console.error('Error fetching kanji:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchInitialKanji();
  }, [selectedLevel]);

  // Load more kanji
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const levelParam =
        selectedLevel !== "All" ? `jlptLevel=${selectedLevel}&` : "";
      const offset = displayedKanji.length;
      const response = await fetch(
        `/api/kanji?${levelParam}limit=${PAGE_SIZE}&offset=${offset}`
      );

      if (response.ok) {
        const newKanji = await response.json();
        setDisplayedKanji((prev) => [...prev, ...newKanji]);
        setHasMore(newKanji.length === PAGE_SIZE);
      }
    } catch (error) {
      console.error('Error loading more kanji:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [selectedLevel, displayedKanji.length, loadingMore, hasMore]);

  // Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          loadMore();
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
  }, [loadMore, loading]);

  // Filter kanji by search
  const filteredKanji = displayedKanji.filter((k) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      k.character.includes(query) ||
      k.kanjiData.meanings.some((m) => m.toLowerCase().includes(query)) ||
      k.id.toLowerCase().includes(query)
    );
  });

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
      await updateCollection.mutateAsync({
        id: collectionId,
        name: name.trim(),
        description: description.trim(),
        studyMode,
        characterIds: Array.from(selectedKanji),
      });

      router.push("/collections/manage");
    } catch (err) {
      setError("Failed to update collection. Please try again.");
    }
  };

  if (loadingCollection) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">学</div>
          <p className="text-gray-600">Loading collection...</p>
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Collection not found</p>
          <Link
            href="/collections/manage"
            className="px-6 py-3 bg-rose-500 text-white rounded-full font-medium hover:bg-rose-600 transition"
          >
            Back to Manage
          </Link>
        </div>
      </div>
    );
  }

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
                Edit Collection
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
                onClick={() => router.push("/collections/manage")}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-full font-medium hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateCollection.isPending || selectedKanji.size === 0}
                className="flex-1 px-4 py-3 bg-rose-500 text-white rounded-full font-medium hover:bg-rose-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateCollection.isPending
                  ? "Updating..."
                  : `Update (${selectedKanji.size})`}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="sticky top-[72px] z-40 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md transition-shadow duration-200 flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search kanji by character, meaning..."
                className="grow bg-transparent border-none outline-none px-4 py-2.5 text-sm placeholder-gray-400 rounded-l-full text-gray-900"
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
        {loading ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4 animate-pulse">学</div>
            <p className="text-gray-600">Loading kanji...</p>
          </div>
        ) : filteredKanji.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl">
            <p className="text-gray-600 mb-2">No kanji found</p>
            <p className="text-sm text-gray-500">
              Try a different search or filter
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-500">
              Showing {filteredKanji.length} of {totalCount} kanji
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredKanji.map((k) => {
                const isSelected = selectedKanji.has(k.id);
                return (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => toggleKanji(k.id)}
                    className={`bg-gray-50 border rounded-xl transition-all duration-200 flex flex-col p-3 group relative hover:shadow-md ${
                      isSelected
                        ? "border-rose-500 bg-rose-50 ring-2 ring-rose-500"
                        : "border-gray-100"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-rose-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
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
                        className={`text-6xl ${
                          isSelected ? "text-rose-900" : "text-gray-800"
                        }`}
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
                      <p className="text-xs font-semibold text-gray-900 capitalize truncate">
                        {k.kanjiData.meanings.slice(0, 2).join(", ")}
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
              {loadingMore && (
                <div className="text-gray-500 text-sm">Loading more...</div>
              )}
              {!hasMore && totalCount > 0 && (
                <div className="text-gray-400 text-sm">All kanji loaded</div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default function EditCollectionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-6xl animate-pulse">学</div>
        </div>
      }
    >
      <EditCollectionForm />
    </Suspense>
  );
}
