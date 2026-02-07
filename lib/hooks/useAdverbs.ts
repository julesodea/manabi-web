import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { Vocabulary } from './useVerbs';

interface AdverbSearchParams {
  query?: string;
  jlptLevel?: string;
  limit?: number;
}

const PAGE_SIZE = 50;

// Fetch adverb count
export function useAdverbsCount(jlptLevel?: string) {
  return useQuery({
    queryKey: ['adverbs', 'count', jlptLevel],
    queryFn: async () => {
      const params = jlptLevel && jlptLevel !== 'All' ? `?jlptLevel=${jlptLevel}` : '';
      const response = await fetch(`/api/adverbs/count${params}`);
      if (!response.ok) throw new Error('Failed to fetch adverbs count');
      const data = await response.json();
      return data.count as number;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}

// Infinite scroll adverbs list with search
export function useAdverbsInfinite({ query, jlptLevel }: AdverbSearchParams) {
  return useInfiniteQuery({
    queryKey: ['adverbs', 'list', query, jlptLevel],
    queryFn: async ({ pageParam = 0 }) => {
      const params = new URLSearchParams();

      if (query) params.set('q', query);
      if (jlptLevel && jlptLevel !== 'All') params.set('jlptLevel', jlptLevel);
      params.set('limit', PAGE_SIZE.toString());
      params.set('offset', pageParam.toString());

      const endpoint = query ? '/api/adverbs/search' : '/api/adverbs';
      const url = `${endpoint}?${params.toString()}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch adverbs');
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

// Fetch single adverb by ID
export function useAdverb(id: string) {
  return useQuery({
    queryKey: ['adverb', id],
    queryFn: async () => {
      const response = await fetch(`/api/adverbs/${id}`);
      if (!response.ok) throw new Error('Failed to fetch adverb');
      return response.json() as Promise<Vocabulary>;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes (adverb data rarely changes)
  });
}
