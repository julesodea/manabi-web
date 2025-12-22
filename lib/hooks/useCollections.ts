import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Collection, StudyMode } from '@/types';

// Fetch all collections
export function useCollections(enabled: boolean = true) {
  return useQuery({
    queryKey: ['collections'],
    queryFn: async () => {
      const response = await fetch('/api/collections');
      if (!response.ok) throw new Error('Failed to load collections');
      return response.json() as Promise<Collection[]>;
    },
    enabled,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    gcTime: 1000 * 60 * 10, // Keep in cache for 10 minutes
  });
}

// Fetch single collection
export function useCollection(id: string) {
  return useQuery({
    queryKey: ['collections', id],
    queryFn: async () => {
      const response = await fetch(`/api/collections/${id}`);
      if (!response.ok) throw new Error('Failed to load collection');
      return response.json() as Promise<Collection>;
    },
    enabled: !!id,
  });
}

// Fetch characters for a collection
export function useCollectionCharacters(collectionId: string) {
  return useQuery({
    queryKey: ['collections', collectionId, 'characters'],
    queryFn: async () => {
      const response = await fetch(`/api/collections/${collectionId}/characters`);
      if (!response.ok) throw new Error('Failed to load characters');
      return response.json();
    },
    enabled: !!collectionId,
  });
}

// Create collection mutation
export function useCreateCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      description: string;
      studyMode: StudyMode;
      characterIds: string[];
    }) => {
      const response = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create collection');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });
}

// Update collection mutation
export function useUpdateCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: {
      id: string;
      name: string;
      description: string;
      studyMode: StudyMode;
      characterIds: string[];
    }) => {
      const response = await fetch(`/api/collections/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update collection');
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['collections', variables.id] });
    },
  });
}

// Delete collection mutation
export function useDeleteCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/collections/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete collection');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });
}
