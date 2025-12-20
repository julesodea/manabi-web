import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/services/database';

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

    const results = await DatabaseService.searchKanji(
      query.trim(),
      jlptLevel || undefined,
      limit ? parseInt(limit) : undefined,
      offset ? parseInt(offset) : undefined
    );

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
