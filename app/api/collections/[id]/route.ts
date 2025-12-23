import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/services/database';
import { createAuthenticatedServerClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const collection = await DatabaseService.getCollectionById(id);

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    return NextResponse.json(collection);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch collection' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Get authenticated server client (respects RLS)
    const supabase = await createAuthenticatedServerClient();

    // Fetch and update using authenticated client - RLS will enforce ownership
    const { data: existingCollection, error: fetchError } = await supabase
      .from('collections')
      .select('*')
      .eq('id', id)
      .eq('type', 'user')
      .single();

    if (fetchError || !existingCollection) {
      return NextResponse.json({ error: 'Collection not found or not editable' }, { status: 404 });
    }

    // Update via authenticated client - RLS ensures user can only update their own collections
    const { data, error } = await supabase
      .from('collections')
      .update({
        name: body.name,
        description: body.description,
        character_ids: body.characterIds,
        study_mode: body.studyMode,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to update collection' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update collection' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get authenticated server client (respects RLS)
    const supabase = await createAuthenticatedServerClient();

    // Verify collection exists and is a user collection
    const { data: existingCollection, error: fetchError } = await supabase
      .from('collections')
      .select('*')
      .eq('id', id)
      .eq('type', 'user')
      .single();

    if (fetchError || !existingCollection) {
      return NextResponse.json({ error: 'Collection not found or not editable' }, { status: 404 });
    }

    // Delete via authenticated client - RLS ensures user can only delete their own collections
    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: 'Failed to delete collection' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete collection' }, { status: 500 });
  }
}
