"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCollections } from "@/lib/hooks/useCollections";
import { useAuth } from "@/lib/providers/AuthProvider";
import { useTheme } from "@/lib/providers/ThemeProvider";

export default function Home() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { colors } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [shouldLoadCollections, setShouldLoadCollections] = useState(false);

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

  // Handle scroll for sticky header shadow
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#f8f9fc] pb-24 sm:pb-0" style={{ opacity: authLoading ? 0 : 1, transition: 'opacity 0.3s' }}>
      {/* Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 duration-300 ${
          scrolled ? "shadow-xl py-3" : "py-4 shadow-lg"
        }`}
        style={{
          backgroundColor: colors.primary,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-bold">
                学
              </div>
              <span className="text-white text-xl font-bold tracking-tight hidden sm:block">
                Manabi
              </span>
            </div>

            {/* Right Menu */}
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/kanji-grid"
                className="px-4 py-2 text-white/90 hover:bg-white/20 rounded-full text-sm font-medium transition"
              >
                Browse
              </Link>
              <Link
                href="/collections/create"
                className="hidden sm:block px-4 py-2 text-white/90 hover:bg-white/20 rounded-full text-sm font-medium transition"
              >
                Create
              </Link>

              {!authLoading && (
                <>
                  {user ? (
                    <div className="relative">
                      <button
                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                        className="flex items-center gap-2 border border-white/30 rounded-full p-1 pl-3 hover:bg-white/20 transition cursor-pointer"
                      >
                        <span className="text-sm font-medium text-white">
                          {user.user_metadata?.name ||
                            user.user_metadata?.full_name ||
                            user.user_metadata?.preferred_username ||
                            user.email?.split("@")[0] ||
                            "User"}
                        </span>
                        {user.user_metadata?.avatar_url ? (
                          <img
                            src={user.user_metadata.avatar_url}
                            alt="Profile"
                            className="w-7 h-7 rounded-full"
                          />
                        ) : (
                          <div className="w-7 h-7 bg-white/20 text-white rounded-full flex items-center justify-center">
                            <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                            </svg>
                          </div>
                        )}
                      </button>

                      {/* Dropdown Menu */}
                      {userMenuOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setUserMenuOpen(false)}
                          />
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                            <Link
                              href="/settings"
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              Settings
                            </Link>
                            <button
                              onClick={() => {
                                signOut();
                                setUserMenuOpen(false);
                              }}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              Sign out
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <>
                      <Link
                        href="/settings"
                        className="hidden sm:block px-4 py-2 text-white/90 hover:bg-white/20 rounded-full text-sm font-medium transition"
                      >
                        Settings
                      </Link>
                      <Link
                        href="/login"
                        className="px-4 py-2 border border-white/30 rounded-full hover:bg-white/20 transition"
                      >
                        <span className="text-sm font-medium text-white">
                          Sign in
                        </span>
                      </Link>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - only for non-logged-in users */}
      {!user && (
        <section className="pt-24 pb-12 sm:pt-32 sm:pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-3xl sm:text-3xl lg:text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">
                Learn Kanji,{" "}
                <span
                  style={{
                    color: colors.primary,
                  }}
                >
                  your way
                </span>
              </h1>
              <p className="mt-6 text-xl sm:text-2xl text-gray-600 leading-relaxed">
                Browse, search, and create custom collections to master Japanese
                characters at your own pace.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/kanji-grid"
                  className="px-8 py-4 text-white rounded-full font-semibold shadow-xl text-lg hover:shadow-2xl"
                  style={{
                    backgroundColor: colors.primary,
                  }}
                >
                  Start Browsing
                </Link>
                <Link
                  href="/collections/create"
                  className="px-8 py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-full font-semibold text-lg"
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
        <section className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-gray-900">
                  2,136
                </div>
                <div className="text-sm text-gray-500 mt-1">Jōyō Kanji</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-gray-900">
                  N5-N1
                </div>
                <div className="text-sm text-gray-500 mt-1">JLPT Levels</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-gray-900">
                  {loading || !shouldLoadCollections ? (
                    <div className="h-10 w-16 bg-gray-200 animate-pulse rounded mx-auto"></div>
                  ) : (
                    collections.length
                  )}
                </div>
                <div className="text-sm text-gray-500 mt-1">Collections</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-gray-900">
                  Free
                </div>
                <div className="text-sm text-gray-500 mt-1">Browse forever</div>
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
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
                Welcome back,{" "}
                <span style={{ color: colors.primary }}>
                  {user.user_metadata?.name ||
                    user.user_metadata?.full_name ||
                    user.user_metadata?.preferred_username ||
                    user.email?.split("@")[0] ||
                    "there"}
                </span>
              </h1>
              <p className="mt-2 text-gray-600">
                Continue your Japanese learning journey
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-xl p-5 border border-gray-200">
                <div
                  className="text-2xl mb-2"
                  style={{ color: colors.primary }}
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
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {loading || !shouldLoadCollections ? (
                    <div className="h-8 w-12 bg-gray-100 animate-pulse rounded"></div>
                  ) : (
                    userCollections.length
                  )}
                </div>
                <div className="text-sm text-gray-600">Collections</div>
              </div>

              <div className="rounded-xl p-5 border border-gray-200">
                <div
                  className="text-2xl mb-2"
                  style={{ color: colors.primary }}
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
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {loading || !shouldLoadCollections ? (
                    <div className="h-8 w-12 bg-gray-100 animate-pulse rounded"></div>
                  ) : (
                    0
                  )}
                </div>
                <div className="text-sm text-gray-600">Day Streak</div>
              </div>

              <div className="rounded-xl p-5 border border-gray-200">
                <div
                  className="text-2xl mb-2"
                  style={{ color: colors.primary }}
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
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {loading || !shouldLoadCollections ? (
                    <div className="h-8 w-12 bg-gray-100 animate-pulse rounded"></div>
                  ) : (
                    0
                  )}
                </div>
                <div className="text-sm text-gray-600">Kanji Learned</div>
              </div>

              <div className="rounded-xl p-5 border border-gray-200">
                <div
                  className="text-2xl mb-2"
                  style={{ color: colors.primary }}
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
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {loading || !shouldLoadCollections ? (
                    <div className="h-8 w-12 bg-gray-100 animate-pulse rounded"></div>
                  ) : (
                    0
                  )}
                </div>
                <div className="text-sm text-gray-600">Reviews Due</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/kanji-grid"
                className="px-6 py-3 text-white rounded-full font-semibold shadow-lg"
                style={{
                  backgroundColor: colors.primary,
                }}
              >
                Browse Kanji
              </Link>
              <Link
                href="/collections/create"
                className="px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-full font-semibold"
              >
                Create Collection
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* My Collections Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">My Collections</h2>
            {userCollections.length > 0 && (
              <Link
                href="/collections/manage"
                className="text-sm font-medium"
                style={{ color: colors.primary }}
              >
                Manage all
              </Link>
            )}
          </div>

          {loading || !shouldLoadCollections ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse rounded-xl border border-gray-200 p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-100 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-100 rounded w-1/2 mb-2"></div>
                      <div className="h-3 bg-gray-100 rounded w-1/3"></div>
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
                  className="group cursor-pointer block rounded-xl border border-gray-200 p-5 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold text-xl"
                      style={{
                        backgroundColor: colors.primary,
                      }}
                    >
                      {collection.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-base mb-1">
                        {collection.name}
                      </h3>
                      <p className="text-gray-600 text-sm line-clamp-2 mb-2 leading-relaxed">
                        {collection.description || "Custom collection"}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
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
              className="block border-2 border-dashed border-gray-200 rounded-xl p-8 hover:border-gray-300 transition-colors"
            >
              <div className="text-center">
                <div
                  className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: colors.primaryLight }}
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    style={{ color: colors.primary }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900">
                  Create your first collection
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Select Kanji to build a custom study set
                </p>
              </div>
            </Link>
          )}
        </div>
      </section>

      {/* System Collections Section */}
      {systemCollections.length > 0 && (
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">
                JLPT Collections
              </h2>
              <span className="text-sm text-gray-500">
                {systemCollections.length} sets
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {systemCollections.map((collection) => (
                <Link
                  key={collection.id}
                  href={`/study/${collection.id}`}
                  className="group cursor-pointer block rounded-xl border border-gray-200 p-5 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold text-lg"
                      style={{
                        backgroundColor: colors.primary,
                      }}
                    >
                      {collection.metadata?.jlptLevel || "漢"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-base mb-2">
                        {collection.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
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
      <footer className="py-8 border-t border-gray-100 hidden sm:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
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
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 pb-safe">
        <div className="grid grid-cols-5 h-20 px-2">
          <Link
            href="/"
            className="flex flex-col items-center justify-center gap-1.5"
            style={{ color: colors.primary }}
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
            className="flex flex-col items-center justify-center gap-1.5 text-gray-500 transition-colors"
            onMouseEnter={(e) => (e.currentTarget.style.color = colors.primary)}
            onMouseLeave={(e) => (e.currentTarget.style.color = '')}
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
              className="absolute -top-6 w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
              style={{
                backgroundColor: colors.primary,
              }}
            >
              <svg
                className="w-8 h-8 text-white"
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
            href="/kanji-grid"
            className="flex flex-col items-center justify-center gap-1.5 text-gray-500 transition-colors"
            style={{ ['--hover-color' as string]: colors.primary }}
            onMouseEnter={(e) => (e.currentTarget.style.color = colors.primary)}
            onMouseLeave={(e) => (e.currentTarget.style.color = '')}
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span className="text-xs font-medium">Cards</span>
          </Link>

          <Link
            href="/settings"
            className="flex flex-col items-center justify-center gap-1.5 text-gray-500 transition-colors"
            onMouseEnter={(e) => (e.currentTarget.style.color = colors.primary)}
            onMouseLeave={(e) => (e.currentTarget.style.color = '')}
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
