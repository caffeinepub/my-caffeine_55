import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { UserProfile, Message, FaqEntry } from '../backend';

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Chat Message Queries
export function useGetPrivateMessages() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Message[]>({
    queryKey: ['privateMessages'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPrivateMessages();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetPublicMessages() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Message[]>({
    queryKey: ['publicMessages'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPublicMessages();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useSendMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ content, isPublic }: { content: string; isPublic: boolean }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.sendMessage(content, isPublic);
    },
    onSuccess: (_, variables) => {
      // Invalidate and refetch the appropriate message list
      if (variables.isPublic) {
        queryClient.invalidateQueries({ queryKey: ['publicMessages'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['privateMessages'] });
      }
      // Also invalidate stats
      queryClient.invalidateQueries({ queryKey: ['chatStats'] });
    },
    onError: (error) => {
      // Log error without exposing message content
      console.error('Send message mutation failed:', error instanceof Error ? error.message : 'Unknown error');
    },
  });
}

// FAQ Queries
export function useFindFaqMatch() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (question: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.findFaqMatch(question);
    },
  });
}

export function useAddFaqEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ question, answer }: { question: string; answer: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addFaqEntry(question, answer);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatStats'] });
    },
  });
}

// Admin Queries
export function useIsCallerAdmin() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !actorFetching,
  });
}

// Transparency Queries
export function useGetChatStats() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<[bigint, bigint, bigint]>({
    queryKey: ['chatStats'],
    queryFn: async () => {
      if (!actor) return [BigInt(0), BigInt(0), BigInt(0)];
      return actor.getChatStats();
    },
    enabled: !!actor && !actorFetching,
  });
}
