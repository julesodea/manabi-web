import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/services/database';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const jlptLevel = searchParams.get('jlptLevel');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    const kanji = await DatabaseService.getAllKanji(
      jlptLevel || undefined,
      limit ? parseInt(limit) : undefined,
      offset ? parseInt(offset) : undefined
    );
    return NextResponse.json(kanji);
  } catch (error) {
    console.error('Error fetching kanji:', error);
    return NextResponse.json({ error: 'Failed to fetch kanji' }, { status: 500 });
  }
}
