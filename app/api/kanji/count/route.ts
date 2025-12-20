import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const jlptLevel = searchParams.get('jlptLevel');

    let query = supabase
      .from('kanji_data')
      .select('*', { count: 'exact', head: true });

    if (jlptLevel && jlptLevel !== 'All') {
      query = query.eq('jlpt_level', jlptLevel);
    }

    const { count, error } = await query;

    if (error) {
      console.error('Error fetching kanji count:', error);
      return NextResponse.json({ error: 'Failed to fetch count' }, { status: 500 });
    }

    // Cache for 10 minutes (count rarely changes)
    return NextResponse.json({ count: count || 0 }, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
      },
    });
  } catch (error) {
    console.error('Error fetching kanji count:', error);
    return NextResponse.json({ error: 'Failed to fetch count' }, { status: 500 });
  }
}
