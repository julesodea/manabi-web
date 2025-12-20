import { useQuery, useInfiniteQuery } from '@tanstack/react-query';

interface ExampleWord {
  word: string;
  reading: string;
  meaning: string;
}

interface ExampleSentence {
  japanese: string;
  reading: string;
  translation: string;
}

interface KanjiWithData {
  id: string;
  character: string;
  strokeCount: number;
  kanjiData: {
    meanings: string[];
    grade: number;
    jlptLevel: string;
    readings: {
      onyomi: string[];
      kunyomi: string[];
      nanori: string[];
    };
    radicals?: string[];
    components?: string[];
    exampleWords?: ExampleWord[];
    exampleSentences?: ExampleSentence[];
  };
}

interface KanjiSearchParams {
  query?: string;
  jlptLevel?: string;
  limit?: number;
}

const PAGE_SIZE = 50;

// Fetch kanji count
export function useKanjiCount(jlptLevel?: string) {
  return useQuery({
    queryKey: ['kanji', 'count', jlptLevel],
    queryFn: async () => {
      const params = jlptLevel && jlptLevel !== 'All' ? `?jlptLevel=${jlptLevel}` : '';
      const response = await fetch(`/api/kanji/count${params}`);
      if (!response.ok) throw new Error('Failed to fetch kanji count');
      const data = await response.json();
      return data.count as number;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}

// Infinite scroll kanji list with search
export function useKanjiInfinite({ query, jlptLevel }: KanjiSearchParams) {
  return useInfiniteQuery({
    queryKey: ['kanji', 'list', query, jlptLevel],
    queryFn: async ({ pageParam = 0 }) => {
      const params = new URLSearchParams();

      if (query) params.set('q', query);
      if (jlptLevel && jlptLevel !== 'All') params.set('jlptLevel', jlptLevel);
      params.set('limit', PAGE_SIZE.toString());
      params.set('offset', pageParam.toString());

      const endpoint = query ? '/api/kanji/search' : '/api/kanji';
      const response = await fetch(`${endpoint}?${params.toString()}`);

      if (!response.ok) throw new Error('Failed to fetch kanji');

      const data = await response.json() as KanjiWithData[];
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

// Fetch single kanji by ID
export function useKanji(id: string) {
  return useQuery({
    queryKey: ['kanji', id],
    queryFn: async () => {
      const response = await fetch(`/api/kanji/${id}`);
      if (!response.ok) throw new Error('Failed to fetch kanji');
      return response.json() as Promise<KanjiWithData>;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes (kanji data rarely changes)
  });
}
