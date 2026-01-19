"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCollections } from "@/lib/hooks/useCollections";
import { useAuth } from "@/lib/providers/AuthProvider";
import { useTheme } from "@/lib/providers/ThemeProvider";
import MinimalHeader from "@/components/MinimalHeader";
import MenuDrawer from "@/components/MenuDrawer";

interface UserStats {
  study_streak: number;
  total_reviews: number;
  characters_learned: number;
  total_study_time: number;
}

export default function Home() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { colors } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [shouldLoadCollections, setShouldLoadCollections] = useState(false);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Defer loading collections until needed
  const { data: collections = [], isLoading: loading } = useCollections(
    shouldLoadCollections
  );

  // Separate system and user collections
  const systemCollections = collections.filter((c) => c.type === "system");
  const userCollections = collections.filter((c) => c.type === "user");

  // Start loading collections after a short delay or when user is logged in
  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldLoadCollections(true);
    }, 100); // Small delay to prioritize initial render

    return () => clearTimeout(timer);
  }, []);

  // Load immediately if user is logged in (they'll see the dashboard)
  useEffect(() => {
    if (user) {
      setShouldLoadCollections(true);
    }
  }, [user]);

  // Fetch user stats when logged in
  useEffect(() => {
    const fetchStats = async () => {
      if (!user) {
        setUserStats(null);
        return;
      }

      setStatsLoading(true);
      try {
        const response = await fetch('/api/learning/stats');
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

  // Handle scroll for sticky header shadow
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background pb-24 sm:pb-0" style={{ opacity: authLoading ? 0 : 1, transition: 'opacity 0.3s' }}>
      {/* Menu Drawer */}
      <MenuDrawer isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Minimal Header */}
      <MinimalHeader
        showMenu
        onMenuClick={() => setMenuOpen(true)}
      />

      {/* Hero Section - only for non-logged-in users */}
      {!user && (
        <section className="pt-24 pb-12 sm:pt-32 sm:pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-5xl sm:text-5xl lg:text-5xl font-extrabold text-foreground tracking-tight leading-tight">
                Learn Kanji,{" "}
                <span className="text-[var(--accent)]">
                  your way
                </span>
              </h1>
              <p className="mt-6 text-xl sm:text-2xl text-muted leading-relaxed">
                Browse, search, and create custom collections to master Japanese
                characters at your own pace.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/kanji-grid"
                  className="px-5 py-2 bg-[var(--accent)] text-[var(--accent-text)] rounded-full font-semibold text-base shadow-md hover:shadow-lg transition-shadow"
                >
                  Start Browsing
                </Link>
                <Link
                  href="/collections/create"
                  className="px-5 py-2 bg-background border-2 border-border text-foreground rounded-full font-semibold text-base hover:bg-card-bg transition"
                >
                  Create Collection
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Stats Section - for non-logged-in users */}
      {!user && (
        <section className="py-12 bg-card-bg border-y border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-foreground">
                  2,136
                </div>
                <div className="text-sm text-muted mt-1">Jōyō Kanji</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-foreground">
                  N5-N1
                </div>
                <div className="text-sm text-muted mt-1">JLPT Levels</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-foreground">
                  {loading || !shouldLoadCollections ? (
                    <div className="h-10 w-16 bg-border animate-pulse rounded mx-auto"></div>
                  ) : (
                    collections.length
                  )}
                </div>
                <div className="text-sm text-muted mt-1">Collections</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-foreground">
                  Free
                </div>
                <div className="text-sm text-muted mt-1">Browse forever</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Welcome Back Dashboard - for logged-in users */}
      {user && (
        <section className="pt-24 pb-8 sm:pt-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Welcome Header */}
            <div className="mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
                Welcome back,{" "}
                <span className="text-[var(--accent)]">
                  {user.user_metadata?.name ||
                    user.user_metadata?.full_name ||
                    user.user_metadata?.preferred_username ||
                    user.email?.split("@")[0] ||
                    "there"}
                </span>
              </h1>
              <p className="mt-2 text-muted">
                Continue your Japanese learning journey
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-card-bg rounded-xl p-5 border border-border shadow-sm">
                <div className="text-2xl mb-2 text-[var(--accent)]">
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
                </div>
                <div className="text-3xl font-bold text-foreground mb-1">
                  {loading || !shouldLoadCollections ? (
                    <div className="h-8 w-12 bg-border animate-pulse rounded"></div>
                  ) : (
                    userCollections.length
                  )}
                </div>
                <div className="text-sm text-muted">Collections</div>
              </div>

              <div className="bg-card-bg rounded-xl p-5 border border-border shadow-sm">
                <div className="text-2xl mb-2 text-[var(--accent)]">
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
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-foreground mb-1">
                  {statsLoading ? (
                    <div className="h-8 w-12 bg-border animate-pulse rounded"></div>
                  ) : (
                    userStats?.study_streak ?? 0
                  )}
                </div>
                <div className="text-sm text-muted">Sessions</div>
              </div>

              <div className="bg-card-bg rounded-xl p-5 border border-border shadow-sm">
                <div className="text-2xl mb-2 text-[var(--accent)]">
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
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-foreground mb-1">
                  {statsLoading ? (
                    <div className="h-8 w-12 bg-border animate-pulse rounded"></div>
                  ) : (
                    userStats?.characters_learned ?? 0
                  )}
                </div>
                <div className="text-sm text-muted">Kanji Learned</div>
              </div>

              <div className="bg-card-bg rounded-xl p-5 border border-border shadow-sm">
                <div className="text-2xl mb-2 text-[var(--accent)]">
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
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-foreground mb-1">
                  {statsLoading ? (
                    <div className="h-8 w-12 bg-border animate-pulse rounded"></div>
                  ) : (
                    userStats?.total_reviews ?? 0
                  )}
                </div>
                <div className="text-sm text-muted">Total Reviews</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/kanji-grid"
                className="px-5 py-2 bg-[var(--accent)] text-[var(--accent-text)] rounded-full font-semibold shadow-md hover:shadow-lg transition-shadow"
              >
                Browse Kanji
              </Link>
              <Link
                href="/collections/create"
                className="px-5 py-2 bg-card-bg border-2 border-border text-foreground rounded-full font-semibold hover:bg-card-bg/80 transition"
              >
                Create Collection
              </Link>
              <Link
                href="/stats"
                className="px-5 py-2 bg-card-bg border-2 border-border text-foreground rounded-full font-semibold hover:bg-card-bg/80 transition"
              >
                View Stats
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* My Collections Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-foreground">My Collections</h2>
            {userCollections.length > 0 && (
              <Link
                href="/collections/manage"
                className="text-sm font-medium text-[var(--accent)] hover:opacity-80 transition-opacity"
              >
                Manage all
              </Link>
            )}
          </div>

          {loading || !shouldLoadCollections ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse bg-card-bg rounded-xl border border-border p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-border rounded-lg flex-shrink-0"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-border rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-border rounded w-1/2 mb-2"></div>
                      <div className="h-3 bg-border rounded w-1/3"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : userCollections.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {userCollections.map((collection) => (
                <Link
                  key={collection.id}
                  href={`/study/${collection.id}`}
                  className="group cursor-pointer block bg-card-bg rounded-xl border border-border p-5 hover:shadow-md transition-all shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 text-[var(--accent-text)] font-bold text-lg bg-[var(--accent)]"
                    >
                      {collection.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground text-base mb-1">
                        {collection.name}
                      </h3>
                      <p className="text-muted text-sm line-clamp-2 mb-2 leading-relaxed">
                        {collection.description || "Custom collection"}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-muted">
                        <svg
                          className="w-4 h-4"
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
                </Link>
              ))}
            </div>
          ) : (
            <Link
              href="/collections/create"
              className="block border-2 border-dashed border-border bg-card-bg rounded-xl p-8 hover:shadow-md transition-all"
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

      {/* System Collections Section */}
      {systemCollections.length > 0 && (
        <section className="py-12 bg-card-bg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-foreground">
                JLPT Collections
              </h2>
              <span className="text-sm text-muted">
                {systemCollections.length} sets
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {systemCollections.map((collection) => (
                <Link
                  key={collection.id}
                  href={`/study/${collection.id}`}
                  className="group cursor-pointer block bg-card-bg rounded-xl border border-border p-5 hover:shadow-md transition-all shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 text-[var(--accent-text)] font-bold text-lg bg-[var(--accent)]"
                    >
                      {collection.metadata?.jlptLevel || "漢"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground text-base mb-2">
                        {collection.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-muted">
                        <svg
                          className="w-4 h-4"
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
                </Link>
              ))}
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
