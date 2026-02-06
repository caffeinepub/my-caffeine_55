import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import { type backendInterface } from '../backend';

export type ActorReadiness = 
  | { status: 'anonymous'; actor: backendInterface | null }
  | { status: 'connecting'; actor: null }
  | { status: 'ready'; actor: backendInterface };

export function useActorReadiness() {
    const { actor, isFetching } = useActor();
    const { identity, isInitializing } = useInternetIdentity();
    
    const isAuthenticated = !!identity;
    const isActorFetching = isFetching || isInitializing;
    
    // Determine readiness state
    const getReadiness = (): ActorReadiness => {
        if (isAuthenticated && (isActorFetching || !actor)) {
            return { status: 'connecting', actor: null };
        }
        
        if (isAuthenticated && actor) {
            return { status: 'ready', actor };
        }
        
        // Anonymous (not authenticated)
        return { 
            status: 'anonymous', 
            actor 
        };
    };

    const readiness = getReadiness();

    return {
        actor,
        isFetching,
        readiness,
        isReady: readiness.status === 'ready',
        isConnecting: readiness.status === 'connecting',
        isAuthenticated,
    };
}
