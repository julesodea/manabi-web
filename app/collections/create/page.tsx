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

  const studyModes: {
    id: StudyMode;
    label: string;
    jp: string;
    desc: string;
  }[] = [
    {
      id: "flashcard",
      label: "Flashcard",
      jp: "フラッシュカード",
      desc: "Flip the card and recall the meaning aloud.",
    },
    {
      id: "multiple_choice",
      label: "Multiple choice",
      jp: "選択式",
      desc: "Pick the correct meaning from four options.",
    },
  ];

  return (
    <div className="min-h-dvh bg-background pb-28">
      <MenuDrawer isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <MinimalHeader
        showMenu
        menuOpen={menuOpen}
        onMenuClick={() => setMenuOpen(true)}
      />

      <form onSubmit={handleSubmit}>
        {/* ───── Editorial header ───── */}
        <section className="pt-24 sm:pt-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-6">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.22em] text-muted font-mono hover:text-foreground transition-colors"
              >
                <span>←</span>
                <span>back</span>
              </button>
              <span className="flex-1 h-px bg-border max-w-32" />
              <span className="font-mono text-[11px] text-muted uppercase tracking-[0.18em]">
                new · 新規作成
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tighter leading-[1.02]">
              Create a<br />
              <span className="text-[var(--accent)]">collection</span>
              <span className="text-foreground">.</span>
            </h1>
            <p className="mt-4 text-base sm:text-lg text-muted leading-relaxed max-w-[55ch]">
              Name your set, choose how you want to study, then pick the
              characters you'd like to drill.
            </p>
          </div>
        </section>

        {/* ───── 01. Details ───── */}
        <section className="mt-12 sm:mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-baseline gap-3 mb-6">
              <span className="font-mono text-xs text-muted tabular-nums">
                01
              </span>
              <h2 className="text-base font-semibold text-foreground tracking-tight">
                Details
              </h2>
              <span className="text-xs text-muted">· 詳細</span>
              <span className="flex-1 h-px bg-border ml-3" />
            </div>

            <div className="grid sm:grid-cols-2 gap-5 max-w-3xl">
              <label className="block">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-semibold text-foreground tracking-tight">
                    Collection name{" "}
                    <span className="text-[var(--accent)]">*</span>
                  </span>
                  <span className="text-[11px] text-muted font-mono tabular-nums">
                    {name.length}/60
                  </span>
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. N5 essentials"
                  maxLength={60}
                  required
                  className="w-full h-14 px-5 rounded-2xl border border-border bg-card-bg text-foreground placeholder:text-muted/60 focus:outline-none focus:border-foreground/60 transition-colors text-[15px]"
                />
              </label>

              <label className="block">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-semibold text-foreground tracking-tight">
                    Description
                  </span>
                  <span className="text-[11px] text-muted font-mono uppercase tracking-[0.18em]">
                    optional
                  </span>
                </div>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A short note for future you"
                  maxLength={140}
                  className="w-full h-14 px-5 rounded-2xl border border-border bg-card-bg text-foreground placeholder:text-muted/60 focus:outline-none focus:border-foreground/60 transition-colors text-[15px]"
                />
              </label>
            </div>
          </div>
        </section>

        {/* ───── 02. Study mode ───── */}
        <section className="mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-baseline gap-3 mb-6">
              <span className="font-mono text-xs text-muted tabular-nums">
                02
              </span>
              <h2 className="text-base font-semibold text-foreground tracking-tight">
                Study mode
              </h2>
              <span className="text-xs text-muted">· 学習方法</span>
              <span className="flex-1 h-px bg-border ml-3" />
            </div>

            <div className="grid sm:grid-cols-2 gap-3 max-w-3xl">
              {studyModes.map((opt) => {
                const active = studyMode === opt.id;
                return (
                  <button
                    type="button"
                    key={opt.id}
                    onClick={() => setStudyMode(opt.id)}
                    className={`group relative text-left p-5 rounded-2xl border transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      active
                        ? "border-foreground bg-card-bg shadow-[0_4px_24px_-12px_rgba(0,0,0,0.15)]"
                        : "border-border bg-card-bg hover:border-foreground/30 hover:-translate-y-px"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-[15px] font-semibold text-foreground tracking-tight">
                          {opt.label}
                        </div>
                        <div className="text-[10px] uppercase tracking-[0.22em] text-muted font-mono mt-1">
                          {opt.jp}
                        </div>
                        <div className="text-sm text-muted mt-3 leading-relaxed">
                          {opt.desc}
                        </div>
                      </div>
                      <div
                        className={`shrink-0 w-5 h-5 rounded-full border-2 grid place-items-center transition-colors ${
                          active
                            ? "border-foreground bg-foreground"
                            : "border-border"
                        }`}
                      >
                        {active && (
                          <div className="w-1.5 h-1.5 rounded-full bg-background" />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ───── 03. Choose kanji ───── */}
        <section className="mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-baseline gap-3 mb-6 flex-wrap">
              <span className="font-mono text-xs text-muted tabular-nums">
                03
              </span>
              <h2 className="text-base font-semibold text-foreground tracking-tight">
                Choose kanji
              </h2>
              <span className="text-xs text-muted">· 漢字選択</span>
              <span className="flex-1 h-px bg-border ml-3 min-w-8" />
              {selectedKanji.size > 0 && (
                <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-foreground bg-card-bg border border-border rounded-full px-3 py-1 tabular-nums">
                  {selectedKanji.size} selected
                </span>
              )}
            </div>
          </div>

          {/* Sticky filter bar */}
          <div className="sticky top-[72px] z-30 backdrop-blur-xl bg-background/85 border-y border-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <svg
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search meanings, readings, characters…"
                    className="w-full h-11 pl-11 pr-4 rounded-xl border border-border bg-card-bg text-[14px] text-foreground placeholder:text-muted/60 focus:outline-none focus:border-foreground/40 transition-colors"
                  />
                </div>
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                  {JLPT_LEVELS.map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setSelectedLevel(level)}
                      className={`px-4 h-11 rounded-xl text-[13px] font-semibold whitespace-nowrap transition-all duration-200 ${
                        selectedLevel === level
                          ? "bg-foreground text-background"
                          : "bg-card-bg text-muted border border-border hover:text-foreground hover:border-foreground/30"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Grid */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {isLoading ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[4/5] rounded-xl bg-card-bg border border-border animate-pulse"
                  />
                ))}
              </div>
            ) : displayedKanji.length === 0 ? (
              <div className="border-y border-border py-20 text-center">
                <div className="text-6xl text-foreground opacity-25 mb-4 font-bold">
                  無
                </div>
                <p className="font-semibold text-foreground tracking-tight">
                  No kanji found
                </p>
                <p className="text-sm text-muted mt-1">
                  Try a different search or JLPT level.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted font-mono tabular-nums">
                    {displayedKanji.length} of {totalCount ?? 0} kanji
                  </p>
                  {selectedKanji.size > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedKanji(new Set())}
                      className="text-[11px] uppercase tracking-[0.18em] text-muted font-mono hover:text-foreground transition-colors"
                    >
                      clear selection
                    </button>
                  )}
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
                        className={`relative rounded-xl border text-left transition-all duration-200 ${
                          isSelected
                            ? "border-foreground bg-card-bg shadow-[0_4px_24px_-12px_rgba(0,0,0,0.18)]"
                            : "border-border bg-card-bg hover:border-foreground/30 hover:-translate-y-px"
                        }`}
                      >
                        <div
                          className={`absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-bold ${badgeClass}`}
                        >
                          {level}
                        </div>

                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-foreground text-background rounded-full w-5 h-5 grid place-items-center">
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

                        <div className="pt-8 pb-2 flex items-center justify-center">
                          <span className="text-[44px] sm:text-[56px] text-foreground">
                            {k.character}
                          </span>
                        </div>

                        <div className="px-2.5 pb-2.5">
                          <p className="font-semibold text-foreground text-xs truncate">
                            {k.kanjiData.meanings.slice(0, 2).map((m, i) => (
                              <span key={i}>
                                {i > 0 && ", "}
                                {m.charAt(0).toUpperCase() + m.slice(1)}
                              </span>
                            ))}
                          </p>
                          <p className="text-muted text-[10px] truncate mt-0.5 font-mono">
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

                <div ref={observerTarget} className="py-8 text-center">
                  {isFetchingNextPage && (
                    <div className="text-[11px] uppercase tracking-[0.22em] text-muted font-mono">
                      loading more…
                    </div>
                  )}
                  {!hasNextPage && (totalCount ?? 0) > 0 && (
                    <div className="text-[11px] uppercase tracking-[0.22em] text-muted font-mono">
                      end of list · 終
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </section>

        {/* ───── Sticky action footer ───── */}
        <div className="fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur-xl border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3 sm:gap-5">
            {error ? (
              <div className="flex-1 flex items-center gap-2 text-sm text-rose-600 dark:text-rose-400 font-medium">
                <svg
                  className="w-4 h-4 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <circle cx="12" cy="12" r="10" />
                  <path strokeLinecap="round" d="M12 8v4M12 16h0" />
                </svg>
                <span>{error}</span>
              </div>
            ) : (
              <div className="flex-1 flex items-center gap-3 min-w-0">
                <span className="font-mono text-2xl sm:text-3xl tabular-nums font-bold text-foreground leading-none">
                  {String(selectedKanji.size).padStart(2, "0")}
                </span>
                <div className="hidden sm:block min-w-0">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-muted font-mono">
                    selected
                  </div>
                  <div className="text-[12px] text-muted truncate">
                    {name.trim() ? `“${name.trim()}”` : "Untitled collection"}
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => router.push("/")}
              className="px-4 sm:px-5 h-12 rounded-2xl text-foreground font-semibold text-[14px] hover:bg-card-bg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createCollection.isPending || !canCreate}
              className="group inline-flex items-center gap-3 px-5 sm:px-6 h-12 rounded-2xl bg-foreground text-background font-semibold text-[14px] shadow-[0_10px_30px_-12px_rgba(0,0,0,0.25)] hover:shadow-[0_18px_40px_-12px_rgba(0,0,0,0.35)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.985] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none"
            >
              {createCollection.isPending ? (
                <>
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-background"
                    style={{ animation: "breathe 1.1s ease-in-out infinite" }}
                  />
                  <span>Creating…</span>
                </>
              ) : (
                <>
                  <span>Create collection</span>
                  <span className="font-mono text-sm opacity-70 group-hover:translate-x-0.5 transition-transform">
                    →
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
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
