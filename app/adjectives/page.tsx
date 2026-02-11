"use client";

import { useState, useEffect, useRef, Suspense, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAdjectivesInfinite, useAdjectivesCount } from "@/lib/hooks/useAdjectives";
import { useTheme } from "@/lib/providers/ThemeProvider";
import MinimalHeader from "@/components/MinimalHeader";
import MenuDrawer from "@/components/MenuDrawer";
import { saveNavigationList } from "@/lib/navigationList";

const JLPT_LEVELS = [
  { label: "All", value: "All" },
  { label: "N5", value: "N5" },
  { label: "N4", value: "N4" },
  { label: "N3", value: "N3" },
  { label: "N2", value: "N2" },
  { label: "N1", value: "N1" },
];

function AdjectivesGridContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectionModeParam = searchParams.get("select") === "true";
  const { colors } = useTheme();

  // Get search and level from URL params
  const urlSearchQuery = searchParams.get("q") || "";
  const urlLevel = searchParams.get("level") || "All";

  const [selectedAdjectives, setSelectedAdjectives] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(selectionModeParam);
  const [searchQuery, setSearchQuery] = useState(urlSearchQuery);
  const [debouncedSearchQuery, setDebouncedSearchQuery] =
    useState(urlSearchQuery);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Update URL when search query changes
  useEffect(() => {
    const timer = setTimeout(() => {
      // Require minimum 2 chars for Latin input to avoid wasteful searches
      // Single Japanese characters (kanji/kana) are allowed
      const isJapanese = /[\u3000-\u9FFF\uF900-\uFAFF]/.test(searchQuery);
      const shouldSearch = searchQuery.length === 0 || isJapanese || searchQuery.length >= 2;

      if (!shouldSearch) return;

      const params = new URLSearchParams(searchParams.toString());

      if (searchQuery) {
        params.set("q", searchQuery);
      } else {
        params.delete("q");
      }

      const newUrl = params.toString()
        ? `?${params.toString()}`
        : "/adjectives";
      const currentUrl = searchParams.toString()
        ? `?${searchParams.toString()}`
        : "/adjectives";

      // Only update URL if it's actually different
      if (newUrl !== currentUrl) {
        router.replace(newUrl, { scroll: false });
      }

      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchParams, router]);

  // Handle scroll for sticky header shadow
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // TanStack Query hooks
  const { data: totalCount } = useAdjectivesCount(urlLevel);
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useAdjectivesInfinite({
      query: debouncedSearchQuery || undefined,
      jlptLevel: urlLevel,
    });

  // Flatten paginated data
  const displayedAdjectives = useMemo(() => {
    return data?.pages.flatMap((page) => page.items) ?? [];
  }, [data]);

  // Save navigation list for detail page prev/next
  useEffect(() => {
    if (displayedAdjectives.length > 0) {
      saveNavigationList("adjectives", displayedAdjectives.map(a => a.id), "/adjectives");
    }
  }, [displayedAdjectives]);

  // Toggle adjective selection
  const toggleAdjective = (id: string) => {
    setSelectedAdjectives((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Create collection with selected adjectives
  const createCollection = () => {
    const ids = Array.from(selectedAdjectives).join(",");
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
    <div className="min-h-screen bg-background">
      {/* Menu Drawer */}
      <MenuDrawer isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Minimal Header */}
      <MinimalHeader
        showMenu
        onMenuClick={() => setMenuOpen(true)}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
            N5 Adjectives
          </h1>
          <p className="text-muted mt-2">
            Essential adjectives for everyday Japanese communication
          </p>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-8">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="flex items-center bg-card-bg border border-border rounded-xl shadow-sm">
              <input
                type="text"
                placeholder="Search meanings, readings..."
                className="flex-1 min-w-0 bg-transparent border-none outline-none focus:outline-none focus:ring-0 px-4 py-3 text-sm font-medium placeholder:text-muted text-foreground"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
          </div>

          {/* JLPT Level Filter and Actions */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {JLPT_LEVELS.map((level) => (
                <button
                  key={level.value}
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString());
                    if (level.value === "All") {
                      params.delete("level");
                    } else {
                      params.set("level", level.value);
                    }
                    const newUrl = params.toString()
                      ? `?${params.toString()}`
                      : "/adjectives";
                    router.replace(newUrl, { scroll: false });
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${urlLevel === level.value
                      ? "bg-[var(--accent)] text-[var(--accent-text)]"
                      : "bg-card-bg text-foreground border border-border hover:bg-[var(--accent)]/10"
                    }`}
                >
                  {level.label}
                </button>
              ))}
            </div>

            {/* Selection Mode Actions */}
            <div className="flex items-center gap-2">
              {selectionMode ? (
                <>
                  {selectedAdjectives.size > 0 && (
                    <button
                      onClick={createCollection}
                      className="px-4 py-2 bg-[var(--accent)] text-[var(--accent-text)] rounded-full text-sm font-semibold shadow-md"
                    >
                      Create ({selectedAdjectives.size})
                    </button>
                  )}
                  <button
                    onClick={() => setSelectionMode(false)}
                    className="px-4 py-2 text-foreground border border-border rounded-full text-sm font-medium hover:bg-card-bg transition"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setSelectionMode(true)}
                  className="px-4 py-2 text-foreground border border-border rounded-full text-sm font-medium hover:bg-card-bg transition"
                >
                  Select
                </button>
              )}
            </div>
          </div>

          {/* Results count */}
          <div className="mt-4 text-sm text-muted">
            {isLoading
              ? "Loading..."
              : searchQuery
                ? `${displayedAdjectives.length} adjectives found`
                : totalCount
                  ? `${totalCount} adjectives`
                  : ""}
          </div>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {[...Array(15)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-card-bg border border-border rounded-xl mb-3"></div>
                <div className="h-4 bg-card-bg rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-card-bg rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : displayedAdjectives.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-foreground">No Adjectives found</h3>
            <p className="text-muted mt-2">
              Try changing your filters or search terms.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                router.replace("/adjectives", { scroll: false });
              }}
              className="mt-6 px-6 py-2 border border-border text-foreground rounded-xl hover:bg-card-bg transition font-medium"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {displayedAdjectives.map((n) => {
                const isSelected = selectedAdjectives.has(n.id);

                const cardContent = (
                  <div className="group cursor-pointer h-full">
                    <div className="h-full flex flex-col bg-card-bg rounded-2xl overflow-hidden shadow-sm border border-border hover:shadow-md transition-all duration-200">
                      {/* Card Image Area */}
                      <div className="relative aspect-square duration-300 bg-card-bg border-b border-border">
                        {/* Selection Indicator */}
                        {selectionMode && isSelected && (
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

                        {/* Adjective Word */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-3xl sm:text-4xl text-foreground font-medium px-4">
                            {n.word}
                          </span>
                        </div>

                        {/* Level Badge */}
                        <div className="absolute top-3 left-3 bg-[var(--accent)]/10 px-2.5 py-1 rounded-lg shadow-sm text-xs font-bold text-[var(--accent)]">
                          {n.jlpt_level || 'N5'}
                        </div>
                      </div>

                      {/* Card Details */}
                      <div className="p-4 flex-1 flex flex-col justify-between min-h-[88px]">
                        <h3 className="font-semibold text-foreground line-clamp-2 text-base">
                          {n.meaning.charAt(0).toUpperCase() + n.meaning.slice(1)}
                        </h3>
                        <p className="text-muted text-sm mt-1 truncate">
                          {n.romaji ? n.romaji.charAt(0).toUpperCase() + n.romaji.slice(1) : n.reading}
                        </p>
                      </div>
                    </div>
                  </div>
                );

                return selectionMode ? (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => toggleAdjective(n.id)}
                    className="text-left"
                  >
                    {cardContent}
                  </button>
                ) : (
                  <Link key={n.id} href={`/adjectives/${n.id}`}>
                    {cardContent}
                  </Link>
                );
              })}
            </div>

            {/* Loading indicator and scroll trigger */}
            <div ref={observerTarget} className="py-8 text-center">
              {isFetchingNextPage && (
                <div className="text-muted">Loading more...</div>
              )}
              {!hasNextPage && totalCount && totalCount > 0 && (
                <div className="text-muted text-sm">
                  All {totalCount} adjectives loaded
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Floating Action Button */}
      {selectionMode && selectedAdjectives.size > 0 && (
        <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-40">
          <button
            onClick={createCollection}
            className="bg-[var(--accent)] text-[var(--accent-text)] px-6 py-3 rounded-full shadow-xl font-medium flex items-center gap-2 hover:shadow-2xl transition-shadow"
          >
            Create Collection ({selectedAdjectives.size})
          </button>
        </div>
      )}
    </div>
  );
}

export default function AdjectivesGridPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{
            backgroundColor: 'var(--theme-primary)'
          }}
        >
          <div className="text-6xl text-white animate-pulse">形</div>
        </div>
      }
    >
      <AdjectivesGridContent />
    </Suspense>
  );
}
