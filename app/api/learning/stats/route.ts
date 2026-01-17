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

    // Get user stats
    let { data: stats, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code === 'PGRST116') {
      // Not found - create initial stats
      const { data: newStats, error: createError } = await supabase
        .from('user_stats')
        .insert({
          user_id: user.id,
          study_streak: 0,
          reviews_today: 0,
          reviews_completed_today: 0,
          total_reviews: 0,
          total_study_time: 0,
          characters_learned: 0,
          level: 1,
        })
        .select()
        .single();

      if (createError) {
        console.error('[createUserStats] Error:', createError);
        return NextResponse.json(
          { error: 'Failed to create user stats' },
          { status: 500 }
        );
      }

      stats = newStats;
    } else if (error) {
      console.error('[getUserStats] Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch stats' },
        { status: 500 }
      );
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
