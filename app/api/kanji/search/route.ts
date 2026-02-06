import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/services/database';

// In-memory cache for search results (persists while lambda is warm)
const searchCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 500;

function getCached(key: string) {
  const entry = searchCache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data;
  }
  if (entry) searchCache.delete(key);
  return null;
}

function setCache(key: string, data: any) {
  // Evict oldest entries if cache is full
  if (searchCache.size >= MAX_CACHE_SIZE) {
    const oldest = [...searchCache.entries()]
      .sort((a, b) => a[1].timestamp - b[1].timestamp)
      .slice(0, 100);
    for (const [k] of oldest) searchCache.delete(k);
  }
  searchCache.set(key, { data, timestamp: Date.now() });
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const jlptLevel = searchParams.get('jlptLevel');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    if (!query || query.trim() === '') {
      // If no query, return regular kanji list
      const kanji = await DatabaseService.getAllKanji(
        jlptLevel || undefined,
        limit ? parseInt(limit) : undefined,
        offset ? parseInt(offset) : undefined
      );
      return NextResponse.json(kanji, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      });
    }

    // Check in-memory cache
    const cacheKey = searchParams.toString();
    const cached = getCached(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
        },
      });
    }

    const results = await DatabaseService.searchKanji(
      query.trim(),
      jlptLevel || undefined,
      limit ? parseInt(limit) : undefined,
      offset ? parseInt(offset) : undefined
    );

    // Store in cache
    setCache(cacheKey, results);

    // Cache search results for 2 minutes
    return NextResponse.json(results, {
      headers: {
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('Error searching kanji:', error);
    return NextResponse.json({ error: 'Failed to search kanji' }, { status: 500 });
  }
}
