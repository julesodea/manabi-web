"use client";

import { useState } from "react";
import Link from "next/link";
import { useCollections } from "@/lib/hooks/useCollections";
import { CollectionCard } from "@/components/CollectionCard";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { Button } from "@/components/ui/Button";

export default function Home() {
  const { data: collections = [], isLoading: loading } = useCollections();
  const [systemCollectionsExpanded, setSystemCollectionsExpanded] =
    useState(false);

  // Separate system and user collections
  const systemCollections = collections.filter((c) => c.type === "system");
  const userCollections = collections.filter((c) => c.type === "user");

  // TODO: Implement learning progress tracking
  const reviewsToday = 0;
  const studyStreak = 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900">
                学び Manabi
              </h1>
            </div>
            <div className="flex gap-2 sm:gap-4">
              <Link href="/kanji-grid">
                <Button variant="secondary" size="sm" className="text-xs sm:text-sm">
                  Browse Kanji
                </Button>
              </Link>
              <Link href="/collections/create">
                <Button variant="primary" size="sm" className="text-xs sm:text-sm">
                  Create
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Section */}
      <div className="bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="text-blue-200 text-sm font-medium mb-1">
                Study Streak
              </div>
              <div className="text-4xl font-bold">{studyStreak} days</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="text-blue-200 text-sm font-medium mb-1">
                Reviews Today
              </div>
              <div className="text-4xl font-bold">{reviewsToday}</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="text-blue-200 text-sm font-medium mb-1">
                Total Collections
              </div>
              <div className="text-4xl font-bold">{collections.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* User Collections */}
        {userCollections.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                My Collections
              </h2>
              <Link href="/collections/manage">
                <Button variant="ghost" size="sm">
                  Manage
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userCollections.map((collection) => (
                <CollectionCard key={collection.id} collection={collection} />
              ))}
            </div>
          </section>
        )}

        {/* System Collections */}
        <section className="mb-12">
          <button
            onClick={() =>
              setSystemCollectionsExpanded(!systemCollectionsExpanded)
            }
            className="flex items-center justify-between my-6 w-full hover:opacity-70 transition-opacity"
          >
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-gray-900">
                System Collections
              </h2>
              <svg
                className={`w-6 h-6 text-gray-600 transition-transform ${
                  systemCollectionsExpanded ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
            <span className="text-sm text-gray-500">
              {systemCollections.length} collections
            </span>
          </button>

          {systemCollectionsExpanded && (
            <>
              {loading ? (
                <LoadingSkeleton count={6} />
              ) : systemCollections.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border">
                  <p className="text-gray-600 mb-4">
                    No collections found. Make sure data is loaded.
                  </p>
                  <p className="text-sm text-gray-500">Run: npm run load-data</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {systemCollections.map((collection) => (
                    <CollectionCard key={collection.id} collection={collection} />
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
