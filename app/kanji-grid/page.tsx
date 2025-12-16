'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';

interface KanjiWithData {
  id: string;
  character: string;
  kanjiData: {
    meanings: string[];
    jlptLevel: string;
  };
}

const JLPT_LEVELS = ['All', 'N5', 'N4', 'N3', 'N2', 'N1'];
const PAGE_SIZE = 50; // Load 50 kanji at a time

export default function KanjiGridPage() {
  const [displayedKanji, setDisplayedKanji] = useState<KanjiWithData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Fetch initial kanji for the selected level
  useEffect(() => {
    async function fetchInitialKanji() {
      setLoading(true);
      setDisplayedKanji([]);
      setHasMore(true);
      try {
        const levelParam = selectedLevel !== 'All' ? `jlptLevel=${selectedLevel}` : '';

        // Fetch count and initial data in parallel
        const [countResponse, dataResponse] = await Promise.all([
          fetch(`/api/kanji/count${levelParam ? `?${levelParam}` : ''}`),
          fetch(`/api/kanji?${levelParam}${levelParam ? '&' : ''}limit=${PAGE_SIZE}&offset=0`)
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
        console.error('Failed to fetch kanji:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchInitialKanji();
  }, [selectedLevel]);

  // Load more kanji when scrolling
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const levelParam = selectedLevel !== 'All' ? `jlptLevel=${selectedLevel}&` : '';
      const offset = displayedKanji.length;
      const response = await fetch(`/api/kanji?${levelParam}limit=${PAGE_SIZE}&offset=${offset}`);

      if (response.ok) {
        const newKanji = await response.json();
        setDisplayedKanji(prev => [...prev, ...newKanji]);
        setHasMore(newKanji.length === PAGE_SIZE);
      }
    } catch (error) {
      console.error('Failed to load more kanji:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [selectedLevel, displayedKanji.length, loadingMore, hasMore]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/" className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block">
                ← Back to Home
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Browse Kanji</h1>
              <p className="text-gray-600 mt-1">
                {loading ? 'Loading...' : totalCount > 0 ? `${totalCount} kanji` : `${displayedKanji.length} kanji`}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex gap-2 overflow-x-auto">
            {JLPT_LEVELS.map(level => (
              <Button
                key={level}
                variant={selectedLevel === level ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setSelectedLevel(level)}
              >
                {level}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Kanji Grid */}
      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <LoadingSkeleton count={15} />
        ) : displayedKanji.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <p className="text-gray-600 mb-4">No kanji found for this level.</p>
            <p className="text-sm text-gray-500">Make sure data is loaded with: npm run load-data</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {displayedKanji.map(k => (
                <Link
                  key={k.id}
                  href={`/kanji/${k.id}`}
                  className="aspect-square bg-white border rounded-lg hover:shadow-lg transition-all duration-200 flex flex-col items-center justify-center p-4 group"
                >
                  <div className="text-6xl mb-2 group-hover:scale-110 transition-transform">
                    {k.character}
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {k.kanjiData.meanings.slice(0, 2).join(', ')}
                    </p>
                    <span className="text-xs text-blue-600 font-medium mt-1 inline-block">
                      {k.kanjiData.jlptLevel}
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Loading indicator and scroll trigger */}
            <div ref={observerTarget} className="py-8 text-center">
              {loadingMore && (
                <div className="text-gray-600">Loading more kanji...</div>
              )}
              {!hasMore && totalCount > 0 && (
                <div className="text-gray-500 text-sm">
                  All {totalCount} kanji loaded!
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
