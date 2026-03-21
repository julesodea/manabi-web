"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useKanjiInfinite, useKanjiCount } from "@/lib/hooks/useKanji";
import { useDebouncedSearch } from "@/lib/hooks/useDebouncedSearch";
import { useInfiniteScroll } from "@/lib/hooks/useInfiniteScroll";
import MinimalHeader from "@/components/MinimalHeader";
import MenuDrawer from "@/components/MenuDrawer";
import { saveNavigationList } from "@/lib/navigationList";
import { useTheme } from "@/lib/providers/ThemeProvider";

const JLPT_BADGE: Record<string, { light: string; dark: string }> = {
  N5: { light: "bg-emerald-100 text-emerald-700", dark: "bg-emerald-900/60 text-emerald-400" },
  N4: { light: "bg-amber-100 text-amber-700", dark: "bg-amber-900/60 text-yellow-300" },
  N3: { light: "bg-violet-100 text-violet-700", dark: "bg-violet-900/60 text-violet-400" },
  N2: { light: "bg-sky-100 text-sky-700", dark: "bg-sky-900/60 text-sky-400" },
  N1: { light: "bg-rose-100 text-rose-700", dark: "bg-rose-900/60 text-rose-400" },
};

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
  const { searchQuery, setSearchQuery, debouncedSearchQuery, urlLevel } = useDebouncedSearch("/kanji-grid");

  const [selectedKanji, setSelectedKanji] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(selectionModeParam);
  const [menuOpen, setMenuOpen] = useState(false);
  const { colors: { isDark } } = useTheme();

  // TanStack Query hooks
  const { data: totalCount } = useKanjiCount(urlLevel);
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useKanjiInfinite({
      query: debouncedSearchQuery || undefined,
      jlptLevel: urlLevel,
    });

  const observerTarget = useInfiniteScroll(fetchNextPage, hasNextPage, isFetchingNextPage);

  // Flatten paginated data
  const displayedKanji = useMemo(() => {
    return data?.pages.flatMap((page) => page.items) ?? [];
  }, [data]);

  // Save navigation list for detail page prev/next
  useEffect(() => {
    if (displayedKanji.length > 0) {
      saveNavigationList("kanji", displayedKanji.map(k => k.id), "/kanji");
    }
  }, [displayedKanji]);

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

  return (
    <div className="min-h-screen bg-background">
      {/* Menu Drawer */}
      <MenuDrawer isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Minimal Header */}
      <MinimalHeader
        showMenu
        menuOpen={menuOpen} onMenuClick={() => setMenuOpen(true)}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
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
                      : "/kanji-grid";
                    router.replace(newUrl, { scroll: false });
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                    urlLevel === level.value
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
                  {selectedKanji.size > 0 && (
                    <button
                      onClick={createCollection}
                      className="px-4 py-2 bg-[var(--accent)] text-[var(--accent-text)] rounded-full text-sm font-semibold shadow-md"
                    >
                      Create ({selectedKanji.size})
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
              ? `${displayedKanji.length} kanji found`
              : totalCount
              ? `${totalCount} kanji`
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
        ) : displayedKanji.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-foreground">No Kanji found</h3>
            <p className="text-muted mt-2">
              Try changing your filters or search terms.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                router.replace("/kanji-grid", { scroll: false });
              }}
              className="mt-6 px-6 py-2 border border-border text-foreground rounded-xl hover:bg-card-bg transition font-medium"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {displayedKanji.map((k) => {
                const isSelected = selectedKanji.has(k.id);
                const level = k.kanjiData.jlptLevel || "N5";
                const badgeColors = JLPT_BADGE[level] || JLPT_BADGE.N5;
                const badgeClass = isDark ? badgeColors.dark : badgeColors.light;

                const cardContent = (
                  <div
                    className={`relative rounded-xl border text-left transition-all duration-150 cursor-pointer ${
                      selectionMode && isSelected
                        ? "border-[var(--accent)] ring-2 ring-[var(--accent)] bg-card-bg"
                        : "border-border bg-card-bg hover:shadow-md"
                    }`}
                  >
                    {/* JLPT pill */}
                    <div className={`absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-bold ${badgeClass}`}>
                      {level}
                    </div>

                    {/* Checkmark */}
                    {selectionMode && isSelected && (
                      <div className="absolute top-2 right-2 bg-[var(--accent)] rounded-full w-5 h-5 flex items-center justify-center text-[var(--accent-text)]">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}

                    {/* Kanji character */}
                    <div className="pt-8 pb-2 flex items-center justify-center">
                      <span className="text-[44px] sm:text-[56px] text-foreground">
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
                      <p className="text-muted text-[11px] truncate mt-0.5">
                        {[
                          k.kanjiData.readings.onyomi[0],
                          k.kanjiData.readings.kunyomi[0],
                        ]
                          .filter(Boolean)
                          .join("、")}
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
                <div className="text-muted">Loading more...</div>
              )}
              {!hasNextPage && totalCount && totalCount > 0 && (
                <div className="text-muted text-sm">
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
            className="bg-[var(--accent)] text-[var(--accent-text)] px-6 py-3 rounded-full shadow-xl font-medium flex items-center gap-2 hover:shadow-2xl transition-shadow"
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
        <div
          className="min-h-screen flex items-center justify-center"
          style={{
            backgroundColor: 'var(--theme-primary)'
          }}
        >
          <div className="text-6xl text-white animate-pulse">学</div>
        </div>
      }
    >
      <KanjiGridContent />
    </Suspense>
  );
}
