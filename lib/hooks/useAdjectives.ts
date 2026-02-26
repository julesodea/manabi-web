import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { Vocabulary } from './useVerbs';

interface AdjectiveSearchParams {
  query?: string;
  jlptLevel?: string;
  genkiChapter?: string;
  limit?: number;
}

const PAGE_SIZE = 50;

// Fetch adjective count
export function useAdjectivesCount(jlptLevel?: string, genkiChapter?: string) {
  return useQuery({
    queryKey: ['adjectives', 'count', jlptLevel, genkiChapter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (jlptLevel && jlptLevel !== 'All') params.set('jlptLevel', jlptLevel);
      if (genkiChapter && genkiChapter !== 'All') params.set('genkiChapter', genkiChapter);
      const qs = params.toString() ? `?${params.toString()}` : '';
      const response = await fetch(`/api/adjectives/count${qs}`);
      if (!response.ok) throw new Error('Failed to fetch adjectives count');
      const data = await response.json();
      return data.count as number;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}

// Infinite scroll adjectives list with search
export function useAdjectivesInfinite({ query, jlptLevel, genkiChapter }: AdjectiveSearchParams) {
  return useInfiniteQuery({
    queryKey: ['adjectives', 'list', query, jlptLevel, genkiChapter],
    queryFn: async ({ pageParam = 0 }) => {
      const params = new URLSearchParams();

      if (query) params.set('q', query);
      if (jlptLevel && jlptLevel !== 'All') params.set('jlptLevel', jlptLevel);
      if (genkiChapter && genkiChapter !== 'All') params.set('genkiChapter', genkiChapter);
      params.set('limit', PAGE_SIZE.toString());
      params.set('offset', pageParam.toString());

      const endpoint = query ? '/api/adjectives/search' : '/api/adjectives';
      const url = `${endpoint}?${params.toString()}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch adjectives');
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

// Fetch single adjective by ID
export function useAdjective(id: string) {
  return useQuery({
    queryKey: ['adjective', id],
    queryFn: async () => {
      const response = await fetch(`/api/adjectives/${id}`);
      if (!response.ok) throw new Error('Failed to fetch adjective');
      return response.json() as Promise<Vocabulary>;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes (adjective data rarely changes)
  });
}
