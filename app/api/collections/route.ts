import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/services/database';
import { Collection } from '@/types';
import { getServerUser } from '@/lib/supabase/server-client';

export async function GET() {
  try {
    const user = await getServerUser();

    // Get all collections (system + user's own if authenticated)
    const collections = await DatabaseService.getAllCollections(user?.id);
    return NextResponse.json(collections);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch collections' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser();
    const body = await request.json();
    const { name, description, studyMode, characterIds } = body;

    if (!name || !characterIds || characterIds.length === 0) {
      return NextResponse.json({ error: 'Name and characterIds are required' }, { status: 400 });
    }

    const collection: Collection = {
      id: `custom_${Date.now()}`,
      name,
      description: description || '',
      type: 'user',
      studyMode,
      characterIds,
      // Use a negative number based on current time to sort user collections at the top
      // Integer max is ~2.1 billion, so use seconds-based value instead of milliseconds
      orderIndex: -Math.floor(Date.now() / 1000),
      metadata: {
        category: 'custom',
        grade: undefined,
        jlptLevel: undefined,
      },
    };

    // Pass user ID if authenticated
    const created = await DatabaseService.createCollection(collection, user?.id || null);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to create collection',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
