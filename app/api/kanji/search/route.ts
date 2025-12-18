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
      return NextResponse.json(kanji);
    }

    const results = await DatabaseService.searchKanji(
      query.trim(),
      jlptLevel || undefined,
      limit ? parseInt(limit) : undefined,
      offset ? parseInt(offset) : undefined
    );

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error searching kanji:', error);
    return NextResponse.json({ error: 'Failed to search kanji' }, { status: 500 });
  }
}
