import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/services/database';
import { LearningProgress } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const characterId = searchParams.get('characterId');

    if (!userId || !characterId) {
      return NextResponse.json({ error: 'Missing userId or characterId' }, { status: 400 });
    }

    const progress = await DatabaseService.getLearningProgress(userId, characterId);
    return NextResponse.json(progress);
  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const progress: LearningProgress = await request.json();
    await DatabaseService.updateLearningProgress(progress);
    return NextResponse.json(progress);
  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
  }
}
