"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCollections } from "@/lib/hooks/useCollections";
import { useAuth } from "@/lib/providers/AuthProvider";

export default function Home() {
  const { data: collections = [], isLoading: loading } = useCollections();
  const { user, loading: authLoading, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  // Separate system and user collections
  const systemCollections = collections.filter((c) => c.type === "system");
  const userCollections = collections.filter((c) => c.type === "user");

  // Handle scroll for sticky header shadow
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center text-white font-bold">
                学
              </div>
              <span className="text-rose-500 text-xl font-bold tracking-tight">
                Manabi
              </span>
            </div>

            {/* Right Menu */}
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/kanji-grid"
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-full text-sm font-medium transition"
              >
                Browse
              </Link>
              <Link
                href="/collections/create"
                className="hidden sm:block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-full text-sm font-medium transition"
              >
                Create
              </Link>

              {!authLoading && (
                <>
                  {user ? (
                    <div className="flex items-center gap-2 border border-gray-300 rounded-full p-1 pl-3 hover:shadow-md transition cursor-pointer">
                      <span className="text-sm font-medium text-gray-700">
                        {user.user_metadata?.name ||
                          user.user_metadata?.full_name ||
                          user.user_metadata?.preferred_username ||
                          user.email?.split("@")[0] ||
                          "User"}
                      </span>
                      <button
                        onClick={() => signOut()}
                        className="text-sm font-medium text-gray-700"
                      >
                        Sign out
                      </button>
                      {user.user_metadata?.avatar_url ? (
                        <img
                          src={user.user_metadata.avatar_url}
                          alt="Profile"
                          className="w-7 h-7 rounded-full"
                        />
                      ) : (
                        <div className="w-7 h-7 bg-gray-500 text-white rounded-full flex items-center justify-center">
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      href="/login"
                      className="flex items-center gap-2 border border-gray-300 rounded-full p-1 pl-3 hover:shadow-md transition"
                    >
                      <span className="text-sm font-medium">Sign in</span>
                      <div className="w-7 h-7 bg-gray-500 text-white rounded-full flex items-center justify-center">
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                      </div>
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-12 sm:pt-32 sm:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight">
              Learn Kanji, <span className="text-rose-500">your way</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-600">
              Browse, search, and create custom collections to master Japanese
              characters at your own pace.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/kanji-grid"
                className="px-8 py-3 bg-rose-500 text-white rounded-full font-medium hover:bg-rose-600 transition shadow-lg hover:shadow-xl"
              >
                Start Browsing
              </Link>
              <Link
                href="/collections/create"
                className="px-8 py-3 border border-gray-300 text-gray-700 rounded-full font-medium hover:bg-gray-50 transition"
              >
                Create Collection
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
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
                {collections.length}
              </div>
              <div className="text-sm text-gray-500 mt-1">Collections</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-gray-900">
                Free
              </div>
              <div className="text-sm text-gray-500 mt-1">Forever</div>
            </div>
          </div>
        </div>
      </section>

      {/* My Collections Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">My Collections</h2>
            {userCollections.length > 0 && (
              <Link
                href="/collections/manage"
                className="text-sm font-medium text-rose-500 hover:text-rose-600"
              >
                Manage all
              </Link>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[4/3] bg-gray-100 rounded-xl mb-3"></div>
                  <div className="h-5 bg-gray-100 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : userCollections.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {userCollections.map((collection) => (
                <Link
                  key={collection.id}
                  href={`/study/${collection.id}`}
                  className="group cursor-pointer"
                >
                  <div className="relative aspect-[4/3] bg-gray-50 rounded-xl overflow-hidden mb-3 border border-gray-100 group-hover:shadow-lg transition-all duration-300">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-4xl font-bold text-gray-300">
                        {collection.name}
                      </span>
                    </div>
                    <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium text-gray-600">
                      {collection.characterIds.length} kanji
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900">
                    {collection.name}
                  </h3>
                  <p className="text-gray-500 text-sm mt-0.5 line-clamp-1">
                    {collection.description || "Custom collection"}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <Link
              href="/collections/create"
              className="block border-2 border-dashed border-gray-200 rounded-xl p-8 hover:border-gray-300 hover:bg-gray-50 transition-all cursor-pointer"
            >
              <div className="text-center">
                <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-gray-400"
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
                <h3 className="font-semibold text-gray-900">
                  Create your first collection
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Select kanji to build a custom study set
                </p>
              </div>
            </Link>
          )}
        </div>
      </section>

      {/* System Collections Section */}
      {systemCollections.length > 0 && (
        <section className="py-12 bg-gray-50">
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
                  className="group cursor-pointer"
                >
                  <div className="relative aspect-[4/3] bg-white rounded-xl overflow-hidden mb-3 border border-gray-100 group-hover:shadow-lg transition-all duration-300">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-6xl font-bold text-gray-200">
                        {collection.metadata?.jlptLevel || "漢"}
                      </span>
                    </div>
                    <div className="absolute top-3 left-3 bg-rose-500 text-white px-2 py-1 rounded-md text-xs font-bold">
                      {collection.metadata?.jlptLevel}
                    </div>
                    <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium text-gray-600">
                      {collection.characterIds.length} kanji
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900">
                    {collection.name}
                  </h3>
                  <p className="text-gray-500 text-sm mt-0.5 line-clamp-1">
                    {collection.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-8 border-t border-gray-100">
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
                className="hover:text-rose-500 transition"
              >
                Browse
              </Link>
              <Link
                href="/collections/create"
                className="hover:text-rose-500 transition"
              >
                Create
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
