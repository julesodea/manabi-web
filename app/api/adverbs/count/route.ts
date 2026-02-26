import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const jlptLevel = searchParams.get('jlptLevel');
    const genkiChapter = searchParams.get('genkiChapter');

    // Build the count query
    let query = supabase
      .from('vocabulary')
      .select('*', { count: 'exact', head: true })
      .eq('part_of_speech', 'adverb');

    // Add JLPT level filter if specified
    if (jlptLevel && jlptLevel !== 'All') {
      query = query.eq('jlpt_level', jlptLevel);
    }

    // Add Genki chapter filter if specified
    if (genkiChapter && genkiChapter !== 'All') {
      query = query.eq('genki_chapter', parseInt(genkiChapter));
    }

    const { count, error } = await query;

    if (error) {
      console.error('Error counting adverbs:', error);
      return NextResponse.json({ error: 'Failed to count adverbs' }, { status: 500 });
    }

    return NextResponse.json({ count: count || 0 });
  } catch (error) {
    console.error('Error counting adverbs:', error);
    return NextResponse.json({ error: 'Failed to count adverbs' }, { status: 500 });
  }
}
