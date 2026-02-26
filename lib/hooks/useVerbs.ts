import { useQuery, useInfiniteQuery } from '@tanstack/react-query';

export interface ExampleSentence {
  japanese?: string;
  reading?: string;
  translation?: string;
}

export interface Vocabulary {
  id: string;
  word: string;
  reading: string;
  romaji: string | null;
  part_of_speech: string;
  meaning: string;
  jlpt_level: string | null;
  genki_chapter: number | null;
  example_sentences: ExampleSentence[];
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface VerbSearchParams {
  query?: string;
  jlptLevel?: string;
  genkiChapter?: string;
  limit?: number;
}

const PAGE_SIZE = 50;

// Fetch verb count
export function useVerbsCount(jlptLevel?: string, genkiChapter?: string) {
  return useQuery({
    queryKey: ['verbs', 'count', jlptLevel, genkiChapter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (jlptLevel && jlptLevel !== 'All') params.set('jlptLevel', jlptLevel);
      if (genkiChapter && genkiChapter !== 'All') params.set('genkiChapter', genkiChapter);
      const qs = params.toString() ? `?${params.toString()}` : '';
      const response = await fetch(`/api/verbs/count${qs}`);
      if (!response.ok) throw new Error('Failed to fetch verbs count');
      const data = await response.json();
      return data.count as number;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}

// Infinite scroll verbs list with search
export function useVerbsInfinite({ query, jlptLevel, genkiChapter }: VerbSearchParams) {
  return useInfiniteQuery({
    queryKey: ['verbs', 'list', query, jlptLevel, genkiChapter],
    queryFn: async ({ pageParam = 0 }) => {
      const params = new URLSearchParams();

      if (query) params.set('q', query);
      if (jlptLevel && jlptLevel !== 'All') params.set('jlptLevel', jlptLevel);
      if (genkiChapter && genkiChapter !== 'All') params.set('genkiChapter', genkiChapter);
      params.set('limit', PAGE_SIZE.toString());
      params.set('offset', pageParam.toString());

      const endpoint = query ? '/api/verbs/search' : '/api/verbs';
      const url = `${endpoint}?${params.toString()}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch verbs');
      }

      const data = await response.json() as Vocabulary[];
      return {
        items: data,
        nextOffset: data.length === PAGE_SIZE ? pageParam + PAGE_SIZE : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    initialPageParam: 0,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}

// Fetch single verb by ID
export function useVerb(id: string) {
  return useQuery({
    queryKey: ['verb', id],
    queryFn: async () => {
      const response = await fetch(`/api/verbs/${id}`);
      if (!response.ok) throw new Error('Failed to fetch verb');
      return response.json() as Promise<Vocabulary>;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes (verb data rarely changes)
  });
}
