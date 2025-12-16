import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/services/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const collection = await DatabaseService.getCollectionById(params.id);

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    return NextResponse.json(collection);
  } catch (error) {
    console.error('Error fetching collection:', error);
    return NextResponse.json({ error: 'Failed to fetch collection' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const existingCollection = await DatabaseService.getCollectionById(params.id);

    if (!existingCollection || existingCollection.type !== 'user') {
      return NextResponse.json({ error: 'Collection not found or not editable' }, { status: 404 });
    }

    const updatedCollection = {
      ...existingCollection,
      name: body.name,
      description: body.description,
      studyMode: body.studyMode,
      characterIds: body.characterIds,
    };

    const result = await DatabaseService.updateCollection(updatedCollection);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating collection:', error);
    return NextResponse.json({ error: 'Failed to update collection' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await DatabaseService.deleteCollection(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting collection:', error);
    return NextResponse.json({ error: 'Failed to delete collection' }, { status: 500 });
  }
}
