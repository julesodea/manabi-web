"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCollections } from "@/lib/hooks/useCollections";
import { useAuth } from "@/lib/providers/AuthProvider";
import MinimalHeader from "@/components/MinimalHeader";
import MenuDrawer from "@/components/MenuDrawer";
import { useTheme } from "@/lib/providers/ThemeProvider";

interface UserStats {
  study_streak: number;
  total_reviews: number;
  characters_learned: number;
  total_study_time: number;
}

const JLPT_COLORS: Record<
  string,
  {
    light: { badge: string; badgeText: string };
    dark: { badge: string; badgeText: string };
  }
> = {
  N5: {
    light: { badge: "bg-emerald-100", badgeText: "text-emerald-700" },
    dark: { badge: "bg-emerald-900/50", badgeText: "text-emerald-400" },
  },
  N4: {
    light: { badge: "bg-amber-100", badgeText: "text-amber-700" },
    dark: { badge: "bg-amber-900/50", badgeText: "text-yellow-300" },
  },
  N3: {
    light: { badge: "bg-violet-100", badgeText: "text-violet-700" },
    dark: { badge: "bg-violet-900/50", badgeText: "text-violet-400" },
  },
  N2: {
    light: { badge: "bg-sky-100", badgeText: "text-sky-700" },
    dark: { badge: "bg-sky-900/50", badgeText: "text-sky-400" },
  },
  N1: {
    light: { badge: "bg-rose-100", badgeText: "text-rose-700" },
    dark: { badge: "bg-rose-900/50", badgeText: "text-rose-400" },
  },
};

const AVATAR_COLORS = [
  {
    light: { bg: "bg-emerald-100", text: "text-emerald-700" },
    dark: { bg: "bg-emerald-900/50", text: "text-emerald-400" },
    bar: "bg-emerald-500",
  },
  {
    light: { bg: "bg-sky-100", text: "text-sky-700" },
    dark: { bg: "bg-sky-900/50", text: "text-sky-400" },
    bar: "bg-sky-500",
  },
  {
    light: { bg: "bg-amber-100", text: "text-amber-700" },
    dark: { bg: "bg-amber-900/50", text: "text-yellow-300" },
    bar: "bg-amber-500",
  },
  {
    light: { bg: "bg-rose-100", text: "text-rose-700" },
    dark: { bg: "bg-rose-900/50", text: "text-rose-400" },
    bar: "bg-rose-400",
  },
  {
    light: { bg: "bg-violet-100", text: "text-violet-700" },
    dark: { bg: "bg-violet-900/50", text: "text-violet-400" },
    bar: "bg-violet-500",
  },
  {
    light: { bg: "bg-teal-100", text: "text-teal-700" },
    dark: { bg: "bg-teal-900/50", text: "text-teal-400" },
    bar: "bg-teal-500",
  },
  {
    light: { bg: "bg-orange-100", text: "text-orange-700" },
    dark: { bg: "bg-orange-900/50", text: "text-orange-400" },
    bar: "bg-orange-500",
  },
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const {
    colors: { isDark },
  } = useTheme();
  const { data: collections = [], isLoading: loading } = useCollections(true);

  // Separate system and user collections
  const systemCollections = collections.filter((c) => c.type === "system");
  const userCollections = collections.filter((c) => c.type === "user");

  // Fetch user stats when logged in
  useEffect(() => {
    const fetchStats = async () => {
      if (!user) {
        setUserStats(null);
        return;
      }

      setStatsLoading(true);
      try {
        const response = await fetch("/api/learning/stats");
        if (response.ok) {
          const data = await response.json();
          setUserStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch user stats:", error);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  return (
    <div
      className="min-h-dvh bg-background pb-24 sm:pb-0"
      style={{ opacity: authLoading ? 0 : 1, transition: "opacity 0.3s" }}
    >
      {/* Menu Drawer */}
      <MenuDrawer isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Minimal Header */}
      <MinimalHeader showMenu menuOpen={menuOpen} onMenuClick={() => setMenuOpen(true)} />

      {/* Hero Section - only for non-logged-in users */}
      {!user && (
        <section className="relative overflow-hidden pt-24 sm:pt-32 pb-24 sm:pb-32">
          {/* Ambient drifting kanji */}
          <div className="absolute inset-0 pointer-events-none select-none">
            {[
              { ch: "漢", top: "12%", left: "78%", size: 140, delay: 0, dur: 18, op: 0.04 },
              { ch: "道", top: "62%", left: "4%",  size: 180, delay: 2, dur: 22, op: 0.05 },
              { ch: "心", top: "82%", left: "84%", size: 100, delay: 4, dur: 16, op: 0.04 },
            ].map((k, i) => (
              <span
                key={i}
                className="absolute font-bold leading-none text-foreground"
                style={{
                  top: k.top,
                  left: k.left,
                  fontSize: `${k.size}px`,
                  opacity: k.op,
                  animation: `drift ${k.dur}s ease-in-out ${k.delay}s infinite`,
                  willChange: "transform",
                }}
              >
                {k.ch}
              </span>
            ))}
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Eyebrow */}
            <div className="flex items-center gap-3 mb-8">
              <span className="text-[11px] uppercase tracking-[0.22em] text-muted">
                学習 · the practice
              </span>
              <span className="flex-1 h-px bg-border max-w-32" />
            </div>

            <div className="grid lg:grid-cols-[1.4fr_1fr] gap-10 lg:gap-14 items-end">
              {/* Headline + CTAs */}
              <div>
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground tracking-tighter leading-[0.95]">
                  Learn kanji,
                  <br />
                  <span className="text-[var(--accent)]">deliberately</span>
                  <span className="text-foreground">.</span>
                </h1>
                <p className="mt-6 text-lg sm:text-xl text-muted leading-relaxed max-w-[52ch]">
                  Browse every jōyō character, build custom collections, study at
                  your own rhythm. No streaks, no guilt — steady practice.
                </p>
                <div className="mt-10 flex flex-wrap gap-3 items-center">
                  <Link
                    href="/collections/create"
                    className="group inline-flex items-center gap-3 px-6 h-12 rounded-2xl bg-[var(--accent)] text-[var(--accent-text)] font-semibold text-[15px] shadow-[0_10px_30px_-12px_rgba(0,0,0,0.25)] hover:shadow-[0_18px_40px_-12px_rgba(0,0,0,0.35)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.985] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  >
                    Create collection
                    <span className="font-mono text-sm opacity-70 group-hover:translate-x-0.5 transition-transform">
                      →
                    </span>
                  </Link>
                  <Link
                    href="/kanji-grid"
                    className="inline-flex items-center gap-2 px-6 h-12 rounded-2xl border border-border bg-card-bg text-foreground font-semibold text-[15px] hover:border-foreground/30 hover:-translate-y-px transition-all duration-200"
                  >
                    Browse kanji
                  </Link>
                  <Link
                    href="/vocab"
                    className="group inline-flex items-center gap-1 px-2 h-12 text-foreground font-medium text-[15px] hover:opacity-70 transition-opacity"
                  >
                    Browse vocab
                    <span className="font-mono text-sm opacity-60 group-hover:translate-x-0.5 transition-transform">
                      →
                    </span>
                  </Link>
                </div>
              </div>

              {/* Feature tile - kanji card */}
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-foreground text-background hidden lg:block">
                <div
                  className="absolute -right-20 -top-20 w-72 h-72 rounded-full border border-background/10 pointer-events-none"
                  style={{ animation: "ensoSpin 80s linear infinite" }}
                />
                <div className="absolute -right-12 -top-12 w-56 h-56 rounded-full border border-background/15 pointer-events-none" />
                <div className="relative h-full p-8 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.22em] opacity-60">
                    <span>kanji · 一</span>
                    <span className="font-mono">0001 / 2136</span>
                  </div>
                  <div className="text-center">
                    <div
                      className="text-[200px] leading-none font-black tracking-tighter"
                      style={{ animation: "breathe 5s ease-in-out infinite" }}
                    >
                      学
                    </div>
                    <div className="mt-5 text-sm font-mono opacity-70">
                      manabu · まなぶ
                    </div>
                    <div className="mt-1 text-base font-medium">
                      to learn, to study
                    </div>
                  </div>
                  <div className="flex justify-between text-[11px] uppercase tracking-[0.22em] opacity-60">
                    <span>strokes · 8</span>
                    <span>jlpt · n5</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Stats ledger - flat, no cards */}
      {!user && (
        <section className="border-y border-border bg-card-bg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 lg:divide-x divide-border">
              {[
                { value: "2,136", label: "Jōyō kanji", sub: "all characters" },
                { value: "N5–N1", label: "JLPT levels", sub: "complete coverage" },
                {
                  value: loading ? null : String(collections.length),
                  label: "Collections",
                  sub: "system + custom",
                },
                { value: "Free", label: "Always", sub: "no paywall" },
              ].map((s, i) => (
                <div
                  key={i}
                  className="px-2 py-8 lg:px-8 lg:py-10 lg:first:pl-0 lg:last:pr-0"
                >
                  <div className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
                    {s.value === null ? (
                      <span className="inline-block h-9 w-16 bg-border animate-pulse rounded" />
                    ) : (
                      s.value
                    )}
                  </div>
                  <div className="mt-2 text-sm font-medium text-foreground">
                    {s.label}
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted font-mono uppercase tracking-[0.18em]">
                    {s.sub}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Welcome Back Dashboard - for logged-in users */}
      {user && (
        <section className="relative pt-24 sm:pt-28 pb-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Eyebrow row */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-[11px] uppercase tracking-[0.22em] text-muted">
                session · 学習
              </span>
              <span className="flex-1 h-px bg-border max-w-24" />
              <span className="font-mono text-[11px] text-muted uppercase tracking-[0.18em]">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}
              </span>
            </div>

            {/* Welcome Header */}
            <div className="mb-10">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tighter leading-[1.02]">
                Welcome back,
                <br />
                <span className="text-[var(--accent)]">
                  {user.user_metadata?.name ||
                    user.user_metadata?.full_name ||
                    user.user_metadata?.preferred_username ||
                    user.email?.split("@")[0] ||
                    "friend"}
                </span>
                <span className="text-foreground">.</span>
              </h1>
              <p className="mt-4 text-base sm:text-lg text-muted leading-relaxed max-w-[52ch]">
                Pick up a collection where you left off, or open something new.
              </p>
            </div>

            {/* Flat ledger stats - no cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 border-y border-border lg:divide-x divide-border">
              {[
                {
                  label: "Collections",
                  value: loading ? null : String(userCollections.length),
                  sub: "yours",
                },
                {
                  label: "Sessions",
                  value: statsLoading ? null : String(userStats?.study_streak ?? 0),
                  sub: "completed",
                },
                {
                  label: "Kanji learned",
                  value: statsLoading
                    ? null
                    : String(userStats?.characters_learned ?? 0),
                  sub: "of 2,136",
                },
                {
                  label: "Reviews",
                  value: statsLoading ? null : String(userStats?.total_reviews ?? 0),
                  sub: "lifetime",
                },
              ].map((s, i) => (
                <div
                  key={i}
                  className="px-2 py-6 lg:px-8 lg:py-8 lg:first:pl-0 lg:last:pr-0"
                >
                  <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted mb-3">
                    {s.label}
                  </div>
                  <div className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight tabular-nums">
                    {s.value === null ? (
                      <span className="inline-block h-9 w-14 bg-border animate-pulse rounded" />
                    ) : (
                      s.value
                    )}
                  </div>
                  <div className="mt-1 text-xs text-muted">{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="mt-10 flex flex-wrap gap-3 items-center">
              <Link
                href="/collections/create"
                className="group inline-flex items-center gap-3 px-6 h-12 rounded-2xl bg-[var(--accent)] text-[var(--accent-text)] font-semibold text-[15px] shadow-[0_10px_30px_-12px_rgba(0,0,0,0.25)] hover:shadow-[0_18px_40px_-12px_rgba(0,0,0,0.35)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.985] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
              >
                Create collection
                <span className="font-mono text-sm opacity-70 group-hover:translate-x-0.5 transition-transform">
                  →
                </span>
              </Link>
              <Link
                href="/kanji-grid"
                className="inline-flex items-center px-5 h-12 rounded-2xl border border-border bg-card-bg text-foreground font-semibold text-[15px] hover:border-foreground/30 hover:-translate-y-px transition-all duration-200"
              >
                Browse kanji
              </Link>
              <Link
                href="/vocab"
                className="inline-flex items-center px-5 h-12 rounded-2xl border border-border bg-card-bg text-foreground font-semibold text-[15px] hover:border-foreground/30 hover:-translate-y-px transition-all duration-200"
              >
                Browse vocab
              </Link>
              <Link
                href="/stats"
                className="group inline-flex items-center gap-1 px-2 h-12 text-foreground font-medium text-[15px] hover:opacity-70 transition-opacity"
              >
                View stats
                <span className="font-mono text-sm opacity-60 group-hover:translate-x-0.5 transition-transform">
                  →
                </span>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* My Collections Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-foreground">
              My Collections
            </h2>
            {userCollections.length > 0 && (
              <Link
                href="/collections/manage"
                className="text-sm font-medium text-[var(--accent)] hover:opacity-80 transition-opacity"
              >
                Manage all
              </Link>
            )}
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="animate-pulse bg-card-bg rounded-2xl border border-border p-5"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-border rounded-xl flex-shrink-0"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-border rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-border rounded w-1/4"></div>
                    </div>
                  </div>
                  <div className="mt-4 h-2 bg-border rounded-full"></div>
                </div>
              ))}
            </div>
          ) : userCollections.length > 0 ? (
            <div className="space-y-4">
              {userCollections.map((collection) => {
                const color = getAvatarColor(collection.name);
                const mode = isDark ? color.dark : color.light;
                return (
                  <Link
                    key={collection.id}
                    href={`/study/${collection.id}`}
                    className="group block bg-card-bg rounded-2xl border border-border p-5 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-bold text-lg ${mode.bg} ${mode.text}`}
                      >
                        {collection.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-foreground text-base">
                          {collection.name}
                        </h3>
                        <p className="text-muted text-sm">
                          {collection.characterIds.length} Kanji
                          <span className="mx-2">·</span>
                          Custom
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <Link
              href="/collections/create"
              className="block border-2 border-dashed border-border bg-card-bg rounded-2xl p-8 hover:shadow-md transition-all"
            >
              <div className="text-center">
                <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-4 bg-[var(--accent)]/10">
                  <svg
                    className="w-6 h-6 text-[var(--accent)]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-foreground">
                  Create your first collection
                </h3>
                <p className="text-sm text-muted mt-1">
                  Select Kanji to build a custom study set
                </p>
              </div>
            </Link>
          )}
        </div>
      </section>

      {/* JLPT Collections Section */}
      {systemCollections.length > 0 && (
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-foreground">
                JLPT Collections
              </h2>
              <span className="text-sm text-muted">
                {systemCollections.length} sets
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {systemCollections.map((collection) => {
                const level = collection.metadata?.jlptLevel || "N5";
                const colors = JLPT_COLORS[level] || JLPT_COLORS.N5;
                const mode = isDark ? colors.dark : colors.light;
                const preview = collection.previewCharacters || [];

                return (
                  <Link
                    key={collection.id}
                    href={`/study/${collection.id}`}
                    className="group block rounded-2xl border border-border bg-card-bg p-5 hover:shadow-lg transition-all"
                  >
                    {/* Header row */}
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm ${mode.badge} ${mode.badgeText}`}
                      >
                        {level}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-foreground text-base leading-tight">
                          {collection.name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-muted mt-1">
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                            />
                          </svg>
                          <span>{collection.characterIds.length} Kanji</span>
                        </div>
                      </div>
                    </div>

                    {/* Kanji preview */}
                    {preview.length > 0 && (
                      <div className="flex gap-2 mt-4">
                        {preview.map((char, i) => (
                          <div
                            key={i}
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-medium text-foreground bg-background"
                          >
                            {char}
                          </div>
                        ))}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-8 border-t border-border hidden sm:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-muted">
            <div className="flex items-center gap-1 mb-4 md:mb-0">
              <span>© 2025 Manabi</span>
              <span className="mx-2">·</span>
              <span>Learn Japanese Kanji</span>
            </div>
            <div className="flex gap-4 font-medium text-gray-700">
              <Link
                href="/kanji-grid"
                className="hover:text-[#5B7FFF] transition"
              >
                Browse
              </Link>
              <Link
                href="/collections/create"
                className="hover:text-[#5B7FFF] transition"
              >
                Create
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-card-bg border-t border-gray-200  z-50 pb-safe">
        <div className="grid grid-cols-5 h-20 px-2">
          <Link
            href="/"
            className="flex flex-col items-center justify-center gap-1.5 text-[var(--accent)]"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span className="text-xs font-medium">Home</span>
          </Link>

          <Link
            href="/collections/manage"
            className="flex flex-col items-center justify-center gap-1.5 text-muted hover:text-[var(--accent)] transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <span className="text-xs font-medium">Collections</span>
          </Link>

          <button className="flex flex-col items-center justify-center relative">
            <Link
              href="/collections/create"
              className="absolute -top-6 w-14 h-14 rounded-full flex items-center justify-center bg-[var(--accent)]"
            >
              <svg
                className="w-8 h-8 text-[var(--accent-text)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </Link>
          </button>

          <Link
            href="/stats"
            className="flex flex-col items-center justify-center gap-1.5 text-muted hover:text-[var(--accent)] transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <span className="text-xs font-medium">Stats</span>
          </Link>

          <Link
            href="/settings"
            className="flex flex-col items-center justify-center gap-1.5 text-muted hover:text-[var(--accent)] transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="text-xs font-medium">Settings</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
