import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/services/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const kanjiData = await DatabaseService.getKanjiData(id);

    if (!kanjiData) {
      return NextResponse.json({ error: 'Kanji data not found' }, { status: 404 });
    }

    return NextResponse.json(kanjiData);
  } catch (error) {
    console.error('Error fetching kanji data:', error);
    return NextResponse.json({ error: 'Failed to fetch kanji data' }, { status: 500 });
  }
}
