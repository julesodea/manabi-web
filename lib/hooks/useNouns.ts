import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { Vocabulary } from './useVerbs';

interface NounSearchParams {
  query?: string;
  jlptLevel?: string;
  limit?: number;
}

const PAGE_SIZE = 50;

// Fetch noun count
export function useNounsCount(jlptLevel?: string) {
  return useQuery({
    queryKey: ['nouns', 'count', jlptLevel],
    queryFn: async () => {
      const params = jlptLevel && jlptLevel !== 'All' ? `?jlptLevel=${jlptLevel}` : '';
      const response = await fetch(`/api/nouns/count${params}`);
      if (!response.ok) throw new Error('Failed to fetch nouns count');
      const data = await response.json();
      return data.count as number;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}

// Infinite scroll nouns list with search
export function useNounsInfinite({ query, jlptLevel }: NounSearchParams) {
  return useInfiniteQuery({
    queryKey: ['nouns', 'list', query, jlptLevel],
    queryFn: async ({ pageParam = 0 }) => {
      const params = new URLSearchParams();

      if (query) params.set('q', query);
      if (jlptLevel && jlptLevel !== 'All') params.set('jlptLevel', jlptLevel);
      params.set('limit', PAGE_SIZE.toString());
      params.set('offset', pageParam.toString());

      const endpoint = query ? '/api/nouns/search' : '/api/nouns';
      const url = `${endpoint}?${params.toString()}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch nouns');
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

// Fetch single noun by ID
export function useNoun(id: string) {
  return useQuery({
    queryKey: ['noun', id],
    queryFn: async () => {
      const response = await fetch(`/api/nouns/${id}`);
      if (!response.ok) throw new Error('Failed to fetch noun');
      return response.json() as Promise<Vocabulary>;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes (noun data rarely changes)
  });
}
