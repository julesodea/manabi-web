'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/lib/redux/store';
import { loadCollections } from '@/lib/redux/slices/charactersSlice';
import { CollectionCard } from '@/components/CollectionCard';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { Button } from '@/components/ui/Button';

export default function Home() {
  const dispatch = useAppDispatch();
  const collections = useAppSelector(state =>
    Object.values(state.characters.collections)
  );
  const loading = useAppSelector(state => state.characters.loading);
  const reviewsToday = useAppSelector(state => state.learning.reviewsToday);
  const studyStreak = useAppSelector(state => state.learning.studyStreak);

  useEffect(() => {
    dispatch(loadCollections());
  }, [dispatch]);

  // Separate system and user collections
  const systemCollections = collections.filter(c => c.type === 'system');
  const userCollections = collections.filter(c => c.type === 'user');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">学び Manabi</h1>
              <p className="text-gray-600 mt-1">Learn Japanese Kanji with Spaced Repetition</p>
            </div>
            <div className="flex gap-4">
              <Link href="/kanji-grid">
                <Button variant="secondary">Browse All Kanji</Button>
              </Link>
              <Link href="/collections/create">
                <Button variant="primary">Create Collection</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Section */}
      <div className="bg-blue-600 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-700 rounded-lg p-6">
              <div className="text-blue-200 text-sm font-medium mb-1">Study Streak</div>
              <div className="text-4xl font-bold">{studyStreak} days</div>
            </div>
            <div className="bg-blue-700 rounded-lg p-6">
              <div className="text-blue-200 text-sm font-medium mb-1">Reviews Today</div>
              <div className="text-4xl font-bold">{reviewsToday}</div>
            </div>
            <div className="bg-blue-700 rounded-lg p-6">
              <div className="text-blue-200 text-sm font-medium mb-1">Total Collections</div>
              <div className="text-4xl font-bold">{collections.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* System Collections */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">System Collections</h2>
            <span className="text-sm text-gray-500">{systemCollections.length} collections</span>
          </div>

          {loading ? (
            <LoadingSkeleton count={6} />
          ) : systemCollections.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border">
              <p className="text-gray-600 mb-4">No collections found. Make sure data is loaded.</p>
              <p className="text-sm text-gray-500">Run: npm run load-data</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {systemCollections.map(collection => (
                <CollectionCard
                  key={collection.id}
                  collection={collection}
                />
              ))}
            </div>
          )}
        </section>

        {/* User Collections */}
        {userCollections.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">My Collections</h2>
              <Link href="/collections/manage">
                <Button variant="ghost" size="sm">Manage</Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userCollections.map(collection => (
                <CollectionCard
                  key={collection.id}
                  collection={collection}
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
