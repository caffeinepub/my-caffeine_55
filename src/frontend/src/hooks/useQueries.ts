import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useActorReadiness } from './useActorReadiness';
import type { UserProfile, Message, FaqEntry, MamaFeedbackMetadata } from '../backend';

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
  const { actor, isReady, readiness } = useActorReadiness();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ content, isPublic }: { content: string; isPublic: boolean }) => {
      // Enhanced actor readiness check
      if (!actor) {
        throw new Error('Actor not available');
      }
      
      // Ensure we're in ready state for authenticated sends
      if (readiness.status === 'connecting') {
        throw new Error('Actor still initializing, please wait');
      }
      
      if (readiness.status === 'anonymous') {
        throw new Error('Authentication required');
      }
      
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

// Feedback Metadata Queries
export function useGetFeedbackMetadata() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<MamaFeedbackMetadata | null>({
    queryKey: ['feedbackMetadata'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getFeedbackMetadata();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useSaveFeedbackMetadata() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (metadata: MamaFeedbackMetadata) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveFeedbackMetadata(metadata);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedbackMetadata'] });
    },
  });
}

export function useClearFeedbackMetadata() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.clearFeedbackMetadata();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedbackMetadata'] });
    },
  });
}

// Privacy-Preserving Learning Queries
export function useGetPppOptIn() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['pppOptIn'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.getPppOptIn();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useSetPppOptIn() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (optIn: boolean) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setPppOptIn(optIn);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pppOptIn'] });
    },
  });
}

export function useStoreAnonymizedSignal() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({ category, normalizedScore }: { category: string; normalizedScore: number }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.storeAnonymizedSignal(category, normalizedScore);
    },
    // Non-critical: don't invalidate queries or block on error
    onError: (error) => {
      console.error('Failed to store anonymized signal:', error instanceof Error ? error.message : 'Unknown error');
    },
  });
}

// Aggregate signal queries for Public Chat
export function useGetAllCategoryStats() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Array<[string, number, bigint]>>({
    queryKey: ['allCategoryStats'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllCategoryStats();
    },
    enabled: !!actor && !actorFetching,
    staleTime: 30000, // Cache for 30 seconds
    retry: 1, // Only retry once on failure
  });
}
