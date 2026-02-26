import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const jlptLevel = searchParams.get('jlptLevel');
    const genkiChapter = searchParams.get('genkiChapter');

    // Build the query
    let query = supabase
      .from('vocabulary')
      .select('*')
      .eq('part_of_speech', 'adverb');

    // Add JLPT level filter if specified
    if (jlptLevel && jlptLevel !== 'All') {
      query = query.eq('jlpt_level', jlptLevel);
    }

    // Add Genki chapter filter if specified
    if (genkiChapter && genkiChapter !== 'All') {
      query = query.eq('genki_chapter', parseInt(genkiChapter));
    }

    // Add pagination and ordering
    query = query
      .order('word', { ascending: true })
      .range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching adverbs:', error);
      return NextResponse.json({ error: 'Failed to fetch adverbs' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching adverbs:', error);
    return NextResponse.json({ error: 'Failed to fetch adverbs' }, { status: 500 });
  }
}
