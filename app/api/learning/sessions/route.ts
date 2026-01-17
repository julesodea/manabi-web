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

    return NextResponse.json({
      sessions: sessions.map((item: any) => ({
        id: item.id,
        collectionId: item.collection_id,
        startTime: item.start_time,
        endTime: item.end_time,
        reviewedCount: item.reviewed_count,
        correctCount: item.correct_count,
        incorrectCount: item.incorrect_count,
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
