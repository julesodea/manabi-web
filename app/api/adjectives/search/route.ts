import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const jlptLevel = searchParams.get('jlptLevel');
    const genkiChapter = searchParams.get('genkiChapter');

    if (!query) {
      return NextResponse.json([]);
    }

    // Build the search query for vocabulary table
    let dbQuery = supabase
      .from('vocabulary')
      .select('*')
      .eq('part_of_speech', 'adjective');

    // Add JLPT level filter if specified
    if (jlptLevel && jlptLevel !== 'All') {
      dbQuery = dbQuery.eq('jlpt_level', jlptLevel);
    }

    // Add Genki chapter filter if specified
    if (genkiChapter && genkiChapter !== 'All') {
      dbQuery = dbQuery.eq('genki_chapter', parseInt(genkiChapter));
    }

    // Search in word, reading, romaji, or meaning
    dbQuery = dbQuery.or(`word.ilike.%${query}%,reading.ilike.%${query}%,romaji.ilike.%${query}%,meaning.ilike.%${query}%`);

    // Add pagination and ordering
    dbQuery = dbQuery
      .order('word', { ascending: true })
      .range(offset, offset + limit - 1);

    const { data, error } = await dbQuery;

    if (error) {
      console.error('Error searching adjectives:', error);
      return NextResponse.json({ error: 'Failed to search adjectives' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error searching adjectives:', error);
    return NextResponse.json({ error: 'Failed to search adjectives' }, { status: 500 });
  }
}
