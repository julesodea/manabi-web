import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Vocabulary } from './useVerbs';

interface VocabSearchParams {
  query?: string;
  jlptLevel?: string;
  limit?: number;
}

const PAGE_SIZE = 50;

// Fetch vocabulary count across all types
export function useVocabCount(jlptLevel?: string) {
  return useQuery({
    queryKey: ['vocab', 'count', jlptLevel],
    queryFn: async () => {
      const params = jlptLevel && jlptLevel !== 'All' ? `?jlptLevel=${jlptLevel}` : '';
      const response = await fetch(`/api/vocab/count${params}`);
      if (!response.ok) throw new Error('Failed to fetch vocabulary count');
      const data = await response.json();
      return data.count as number;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}

// Infinite scroll vocabulary list with search (all types)
export function useVocabInfinite({ query, jlptLevel }: VocabSearchParams) {
  return useInfiniteQuery({
    queryKey: ['vocab', 'list', query, jlptLevel],
    queryFn: async ({ pageParam = 0 }) => {
      const params = new URLSearchParams();

      if (query) params.set('q', query);
      if (jlptLevel && jlptLevel !== 'All') params.set('jlptLevel', jlptLevel);
      params.set('limit', PAGE_SIZE.toString());
      params.set('offset', pageParam.toString());

      const endpoint = query ? '/api/vocab/search' : '/api/vocab';
      const url = `${endpoint}?${params.toString()}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch vocabulary');
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
