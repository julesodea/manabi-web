"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useCreateCollection } from "@/lib/hooks/useCollections";
import { StudyMode } from "@/types";

interface KanjiWithData {
  id: string;
  character: string;
  kanjiData: {
    meanings: string[];
    jlptLevel: string;
  };
}

const JLPT_LEVELS = ["All", "N5", "N4", "N3", "N2", "N1"];
const PAGE_SIZE = 50;

function CreateCollectionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const createCollection = useCreateCollection();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [studyMode, setStudyMode] = useState<StudyMode>("flashcard");
  const [error, setError] = useState("");

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
        console.error("Failed to fetch kanji:", error);
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
      console.error("Failed to load more kanji:", error);
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Link
                href="/"
                className="text-blue-600 hover:text-blue-700 text-sm mb-1 inline-block"
              >
                Back to Home
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                Create Collection
              </h1>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Selected</div>
              <div className="text-2xl font-bold text-blue-600">
                {selectedKanji.size}
              </div>
            </div>
          </div>

          {/* Collection Info Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-900 placeholder:text-gray-500"
                placeholder="Collection Name *"
                required
              />
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-900 placeholder:text-gray-500"
                placeholder="Description (optional)"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStudyMode("flashcard")}
                className={`flex-1 px-4 py-2 border-2 rounded-lg transition-colors text-sm ${
                  studyMode === "flashcard"
                    ? "border-blue-600 bg-blue-50 text-blue-900"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                📇 Flashcard
              </button>
              <button
                type="button"
                onClick={() => setStudyMode("multiple_choice")}
                className={`flex-1 px-4 py-2 border-2 rounded-lg transition-colors text-sm ${
                  studyMode === "multiple_choice"
                    ? "border-blue-600 bg-blue-50 text-blue-900"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                ✅ Multiple Choice
              </button>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push("/")}
                size="sm"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={
                  createCollection.isPending || selectedKanji.size === 0
                }
                size="sm"
                className="flex-1"
              >
                {createCollection.isPending
                  ? "Creating..."
                  : `Create (${selectedKanji.size})`}
              </Button>
            </div>
          </form>
        </div>
      </header>

      {/* Filters & Search */}
      <div className="bg-white border-b sticky top-[220px] z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search kanji by character, meaning, or ID..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 placeholder:text-gray-500"
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
      <main className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4 animate-pulse">学</div>
            <p className="text-gray-600">Loading kanji...</p>
          </div>
        ) : filteredKanji.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <p className="text-gray-600 mb-2">No kanji found</p>
            <p className="text-sm text-gray-500">
              Try a different search or filter
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-600">
              Showing {filteredKanji.length} of {totalCount} kanji
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
              {filteredKanji.map((k) => {
                const isSelected = selectedKanji.has(k.id);
                return (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => toggleKanji(k.id)}
                    className={`aspect-square bg-white border-2 rounded-lg hover:shadow-lg transition-all duration-200 flex flex-col items-center justify-center p-2 group relative ${
                      isSelected
                        ? "border-blue-600 bg-blue-50 ring-2 ring-blue-600"
                        : "border-gray-200"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-1 right-1 bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                        ✓
                      </div>
                    )}
                    <div
                      className={`text-4xl mb-1 group-hover:scale-110 transition-transform ${
                        isSelected ? "text-blue-900" : "text-gray-700"
                      }`}
                    >
                      {k.character}
                    </div>
                    <div className="text-center">
                      <span className="text-xs text-blue-600 font-medium">
                        {k.kanjiData.jlptLevel}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div ref={observerTarget} className="py-6 text-center">
              {loadingMore && (
                <div className="text-gray-600 text-sm">Loading more...</div>
              )}
              {!hasMore && totalCount > 0 && (
                <div className="text-gray-500 text-sm">All kanji loaded!</div>
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
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-6xl animate-pulse">学</div>
        </div>
      }
    >
      <CreateCollectionForm />
    </Suspense>
  );
}
