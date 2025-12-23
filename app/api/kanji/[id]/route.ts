import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/services/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch both character and kanji data in parallel
    const [character, kanjiData] = await Promise.all([
      DatabaseService.getCharacterById(id),
      DatabaseService.getKanjiData(id)
    ]);

    if (!character || !kanjiData) {
      return NextResponse.json({ error: 'Kanji not found' }, { status: 404 });
    }

    // Return combined data
    return NextResponse.json({
      id: character.id,
      character: character.character,
      strokeCount: character.strokeCount,
      kanjiData: {
        meanings: kanjiData.meanings,
        grade: kanjiData.grade,
        jlptLevel: kanjiData.jlptLevel,
        readings: kanjiData.readings,
        radicals: kanjiData.radicals,
        components: kanjiData.components,
        exampleWords: kanjiData.exampleWords,
        exampleSentences: kanjiData.exampleSentences,
      }
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch kanji data' }, { status: 500 });
  }
}
