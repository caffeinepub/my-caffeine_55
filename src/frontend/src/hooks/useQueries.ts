import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useActorReadiness } from './useActorReadiness';
import type { UserProfile, Message, FaqEntry, MamaFeedbackMetadata, FaqSuggestion } from '../backend';

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

export function useGetPublicMessages(options?: { refetchInterval?: number }) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Message[]>({
    queryKey: ['publicMessages'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPublicMessages();
    },
    enabled: !!actor && !actorFetching,
    refetchInterval: options?.refetchInterval,
  });
}

export function useSendMessage() {
  const { actor, isReady, readiness } = useActorReadiness();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ content, isPublic }: { content: string; isPublic: boolean }) => {
      if (!actor) {
        throw new Error('Actor not available');
      }
      
      if (readiness.status === 'connecting') {
        throw new Error('Actor still initializing, please wait');
      }
      
      if (readiness.status === 'anonymous') {
        throw new Error('Authentication required');
      }
      
      await actor.sendMessage(content, isPublic);
    },
    onSuccess: (_, variables) => {
      if (variables.isPublic) {
        queryClient.invalidateQueries({ queryKey: ['publicMessages'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['privateMessages'] });
      }
      queryClient.invalidateQueries({ queryKey: ['chatStats'] });
      queryClient.invalidateQueries({ queryKey: ['publicTransparencyStats'] });
      queryClient.invalidateQueries({ queryKey: ['aggregateVarietySeed'] });
      queryClient.invalidateQueries({ queryKey: ['allCategoryStats'] });
    },
    onError: (error) => {
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
      queryClient.invalidateQueries({ queryKey: ['publicTransparencyStats'] });
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

// Transparency Queries (Admin-only)
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

// Public Transparency Stats (No authentication required)
export function useGetPublicTransparencyStats(options?: { refetchInterval?: number }) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<{
    totalPublicMessages: bigint;
    totalPrivateMessages: bigint;
    totalFaqEntries: bigint;
  }>({
    queryKey: ['publicTransparencyStats'],
    queryFn: async () => {
      if (!actor) {
        return {
          totalPublicMessages: BigInt(0),
          totalPrivateMessages: BigInt(0),
          totalFaqEntries: BigInt(0),
        };
      }
      return actor.getPubliclyAccessibleStats();
    },
    enabled: !!actor && !actorFetching,
    refetchInterval: options?.refetchInterval,
    retry: 1,
    placeholderData: {
      totalPublicMessages: BigInt(0),
      totalPrivateMessages: BigInt(0),
      totalFaqEntries: BigInt(0),
    },
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

// Privacy-Preserving Learning - Automatic signal storage
export function useStoreAnonymizedSignal() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ category, normalizedScore }: { category: string; normalizedScore: number }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.storeAnonymizedSignal(category, normalizedScore);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aggregateVarietySeed'] });
      queryClient.invalidateQueries({ queryKey: ['allCategoryStats'] });
    },
    onError: (error) => {
      console.error('Failed to store anonymized signal:', error instanceof Error ? error.message : 'Unknown error');
    },
  });
}

// Aggregate signal queries with refresh support for TransparencyPage
export function useGetAllCategoryStats(options?: { refetchInterval?: number; staleTime?: number }) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Array<[string, number, bigint]>>({
    queryKey: ['allCategoryStats'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllCategoryStats();
    },
    enabled: !!actor && !actorFetching,
    staleTime: options?.staleTime ?? 30000,
    refetchInterval: options?.refetchInterval,
    retry: 1,
    placeholderData: [],
  });
}

// Aggregate variety seed for deterministic Public Chat variety
export function useGetAggregateVarietySeed(options?: { refetchInterval?: number; staleTime?: number }) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<number>({
    queryKey: ['aggregateVarietySeed'],
    queryFn: async () => {
      if (!actor) return 0;
      const seed = await actor.getVarietySeedWithFallback();
      return Number(seed);
    },
    enabled: !!actor && !actorFetching,
    staleTime: options?.staleTime ?? 30000,
    refetchInterval: options?.refetchInterval,
    retry: 1,
    placeholderData: 0,
  });
}

// FAQ Suggestion Queries (Admin-only)
export function useGetPendingFaqSuggestions() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<FaqSuggestion[]>({
    queryKey: ['pendingFaqSuggestions'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPendingFaqSuggestions();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useIgnoreFaqSuggestion() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (question: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.ignoreFaqSuggestion(question);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingFaqSuggestions'] });
    },
  });
}

export function usePromoteFaqSuggestion() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ question, answer }: { question: string; answer: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.promoteFaqSuggestion(question, answer);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingFaqSuggestions'] });
      queryClient.invalidateQueries({ queryKey: ['chatStats'] });
      queryClient.invalidateQueries({ queryKey: ['publicTransparencyStats'] });
    },
  });
}
