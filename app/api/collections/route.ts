import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/services/database';
import { Collection } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const userId = searchParams.get('userId');

    if (type === 'user' && userId) {
      const collections = await DatabaseService.getUserCollections(userId);
      return NextResponse.json(collections);
    }

    const collections = await DatabaseService.getAllCollections();
    return NextResponse.json(collections);
  } catch (error) {
    console.error('Error fetching collections:', error);
    return NextResponse.json({ error: 'Failed to fetch collections' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, studyMode, characterIds, userId } = body;

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

    // TODO: Add authentication - passing null for userId until auth is implemented
    const created = await DatabaseService.createCollection(collection, null);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error creating collection:', error);
    // Log the full error details
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return NextResponse.json({
      error: 'Failed to create collection',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
