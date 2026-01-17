import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      collectionId,
      startTime,
      endTime,
      reviewedCount,
      correctCount,
      incorrectCount,
      characterResults,
      totalCharacters,
    } = body;

    // Validate required fields
    if (!collectionId) {
      return NextResponse.json(
        { error: 'Missing required field: collectionId' },
        { status: 400 }
      );
    }

    // Check if this is a full collection completion
    const isFullCompletion = reviewedCount >= totalCharacters;

    if (!isFullCompletion) {
      return NextResponse.json(
        { error: 'Session not complete. Must review all cards to save.', saved: false },
        { status: 200 }
      );
    }

    // Calculate study time in seconds
    const studyTimeSeconds = Math.floor((endTime - startTime) / 1000);

    // Save the study session
    const { data: session, error: sessionError } = await supabase
      .from('study_sessions')
      .insert({
        user_id: user.id,
        collection_id: collectionId,
        start_time: startTime,
        end_time: endTime,
        reviewed_count: reviewedCount,
        correct_count: correctCount,
        incorrect_count: incorrectCount,
      })
      .select()
      .single();

    if (sessionError) {
      console.error('[saveStudySession] Error:', sessionError);
      return NextResponse.json(
        { error: 'Failed to save study session' },
        { status: 500 }
      );
    }

    // Get or create user stats
    let { data: stats } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!stats) {
      // Create initial stats
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
      } else {
        stats = newStats;
      }
    }

    // Update user stats
    if (stats) {
      const { error: updateError } = await supabase
        .from('user_stats')
        .update({
          study_streak: stats.study_streak + 1,
          total_reviews: stats.total_reviews + reviewedCount,
          reviews_completed_today: stats.reviews_completed_today + correctCount,
          total_study_time: stats.total_study_time + studyTimeSeconds,
          last_study_date: new Date().toISOString().split('T')[0],
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('[incrementUserStreak] Error:', updateError);
      }
    }

    // Update learning progress for each character
    if (characterResults && characterResults.length > 0) {
      const now = Date.now();

      for (const result of characterResults) {
        // Get existing progress
        const { data: existing } = await supabase
          .from('learning_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('character_id', result.characterId)
          .single();

        if (existing) {
          // Update existing progress
          const newCorrectCount = existing.correct_count + (result.correct ? 1 : 0);
          const newIncorrectCount = existing.incorrect_count + (result.correct ? 0 : 1);
          let newSrsLevel = existing.srs_level;

          if (result.correct) {
            newSrsLevel = Math.min(newSrsLevel + 1, 8);
          } else {
            newSrsLevel = Math.max(newSrsLevel - 1, 1);
          }

          // Calculate next review date
          const intervals = [0, 4, 8, 24, 48, 96, 168, 336, 720]; // hours
          const hoursUntilReview = intervals[newSrsLevel] || 4;
          const nextReviewDate = now + hoursUntilReview * 60 * 60 * 1000;

          const totalAttempts = newCorrectCount + newIncorrectCount;
          const meaningAccuracy = totalAttempts > 0 ? newCorrectCount / totalAttempts : 0;

          await supabase
            .from('learning_progress')
            .update({
              last_reviewed: now,
              correct_count: newCorrectCount,
              incorrect_count: newIncorrectCount,
              srs_level: newSrsLevel,
              next_review_date: nextReviewDate,
              meaning_accuracy: meaningAccuracy,
            })
            .eq('user_id', user.id)
            .eq('character_id', result.characterId);
        } else {
          // Create new progress
          const srsLevel = result.correct ? 2 : 1;
          const intervals = [0, 4, 8, 24, 48, 96, 168, 336, 720];
          const hoursUntilReview = intervals[srsLevel] || 4;
          const nextReviewDate = now + hoursUntilReview * 60 * 60 * 1000;

          await supabase
            .from('learning_progress')
            .insert({
              user_id: user.id,
              character_id: result.characterId,
              first_seen: now,
              last_reviewed: now,
              correct_count: result.correct ? 1 : 0,
              incorrect_count: result.correct ? 0 : 1,
              srs_level: srsLevel,
              next_review_date: nextReviewDate,
              meaning_accuracy: result.correct ? 1 : 0,
            });
        }
      }
    }

    return NextResponse.json({
      success: true,
      saved: true,
      session: {
        id: session.id,
        collectionId: session.collection_id,
        startTime: session.start_time,
        endTime: session.end_time,
        reviewedCount: session.reviewed_count,
        correctCount: session.correct_count,
        incorrectCount: session.incorrect_count,
      },
    });
  } catch (error) {
    console.error('Error saving study session:', error);
    return NextResponse.json(
      { error: 'Failed to save study session' },
      { status: 500 }
    );
  }
}
