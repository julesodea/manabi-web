import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createAuthenticatedServerClient();

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const { data: sessions, error } = await supabase
      .from('study_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[getStudySessions] Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch study sessions' },
        { status: 500 }
      );
    }

    // Fetch session results for all sessions
    const sessionIds = sessions.map((s: any) => s.id);

    const { data: allResults } = await supabase
      .from('session_results')
      .select(`
        character_id,
        correct,
        session_id,
        characters (
          character
        )
      `)
      .in('session_id', sessionIds);

    // Get unique character IDs to fetch kanji data
    const characterIds = [...new Set((allResults || []).map((r: any) => r.character_id))];

    // Fetch kanji data separately
    const { data: kanjiData } = await supabase
      .from('kanji_data')
      .select('character_id, meanings')
      .in('character_id', characterIds);

    // Create a lookup map for kanji meanings
    const kanjiMeanings: Record<string, string> = {};
    if (kanjiData) {
      for (const k of kanjiData) {
        kanjiMeanings[k.character_id] = k.meanings?.[0] || '';
      }
    }

    // Group results by session_id
    const resultsBySession: Record<string, any[]> = {};
    if (allResults) {
      for (const result of allResults as any[]) {
        if (!resultsBySession[result.session_id]) {
          resultsBySession[result.session_id] = [];
        }
        resultsBySession[result.session_id].push(result);
      }
    }

    return NextResponse.json({
      sessions: sessions.map((item: any) => ({
        id: item.id,
        collectionId: item.collection_id,
        startTime: item.start_time,
        endTime: item.end_time,
        reviewedCount: item.reviewed_count,
        correctCount: item.correct_count,
        incorrectCount: item.incorrect_count,
        results: (resultsBySession[item.id] || []).map((r: any) => ({
          characterId: r.character_id,
          character: r.characters?.character || '',
          meaning: kanjiMeanings[r.character_id] || '',
          correct: r.correct,
        })),
      })),
    });
  } catch (error) {
    console.error('Error fetching study sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch study sessions' },
      { status: 500 }
    );
  }
}
