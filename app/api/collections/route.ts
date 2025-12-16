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

    const collection: Collection = {
      id: `custom_${Date.now()}`,
      name,
      description,
      type: 'user',
      studyMode,
      characterIds,
      orderIndex: -Date.now(),
      metadata: { category: 'custom' },
    };

    const created = await DatabaseService.createCollection(collection, userId);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error creating collection:', error);
    return NextResponse.json({ error: 'Failed to create collection' }, { status: 500 });
  }
}
