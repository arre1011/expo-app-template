import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import {
  Session,
  SessionWithDrinks,
  UserProfile,
  DrinkEntry,
  CreateDrinkEntry,
  isSessionActive,
} from '../../domain/models/types';
import * as sessionRepository from '../../data/repositories/sessionRepository';
import * as sessionService from '../../domain/services/sessionService';
import { drinkDataEvents } from './drinkDataEvents';
import { calculateBACTimeSeries } from '../../domain/services/bacCalculator';
import { BACTimeSeries } from '../../domain/models/types';

interface SessionState {
  // Current session being displayed
  currentSession: SessionWithDrinks | null;

  // Navigation (kept for backwards compatibility)
  previousSession: Session | null;
  nextSession: Session | null;
  totalSessionCount: number;

  // Past sessions list (for history display)
  pastSessions: Session[];

  // BAC data for current session
  bacTimeSeries: BACTimeSeries | null;

  // Loading states
  isLoading: boolean;
  isNavigating: boolean;

  // Profile reference (needed for BAC calculations)
  profile: UserProfile | null;

  // Actions
  setProfile: (profile: UserProfile | null) => void;
  loadCurrentSession: () => Promise<void>;
  loadSessionById: (sessionId: number) => Promise<void>;
  navigateToPreviousSession: () => Promise<void>;
  navigateToNextSession: () => Promise<void>;
  navigateToLatestSession: () => Promise<void>;
  refreshAfterDrinkChange: () => Promise<void>;
  initializeSessions: (profile: UserProfile) => Promise<void>;
  loadPastSessions: () => Promise<void>;
  refreshBACOnly: () => void; // Lightweight refresh for timer updates
}

export const useSessionStore = create<SessionState>((set, get) => ({
  // Initial state
  currentSession: null,
  previousSession: null,
  nextSession: null,
  totalSessionCount: 0,
  pastSessions: [],
  bacTimeSeries: null,
  isLoading: true,
  isNavigating: false,
  profile: null,

  setProfile: (profile) => {
    set({ profile });
  },

  loadCurrentSession: async () => {
    const { profile } = get();
    set({ isLoading: true });

    try {
      // Try to get active session first
      let sessionWithDrinks = await sessionRepository.getActiveSession();

      // If no active session, check if we should show a recent session with drinks
      if (!sessionWithDrinks) {
        const mostRecent = await sessionRepository.getMostRecentSession();
        if (mostRecent) {
          const recentSession = await sessionRepository.getSessionWithDrinks(mostRecent.id);
          // Only show recent session if it has drinks AND it's still "active" (user is not sober)
          if (recentSession && recentSession.drinks.length > 0 && isSessionActive(recentSession)) {
            sessionWithDrinks = recentSession;
          }
        }
      }

      // Load all sessions for past sessions list
      const allSessions = await sessionRepository.getAllSessions();

      if (sessionWithDrinks && sessionWithDrinks.drinks.length > 0) {
        // Get adjacent sessions for navigation
        const adjacent = await sessionRepository.getAdjacentSessions(sessionWithDrinks.id);
        const count = await sessionRepository.getSessionCount();

        // Calculate BAC time series
        let bacTimeSeries: BACTimeSeries | null = null;
        if (profile) {
          bacTimeSeries = calculateBACTimeSeries(sessionWithDrinks.drinks, profile);
        }

        // Filter out current session from past sessions
        const pastSessions = allSessions.filter(s => s.id !== sessionWithDrinks.id);

        set({
          currentSession: sessionWithDrinks,
          previousSession: adjacent.previous,
          nextSession: adjacent.next,
          totalSessionCount: count,
          pastSessions,
          bacTimeSeries,
          isLoading: false,
        });
      } else {
        // No active sessions - show welcome screen
        // Get most recent session for navigation purposes (if exists)
        const mostRecent = await sessionRepository.getMostRecentSession();
        const count = await sessionRepository.getSessionCount();

        set({
          currentSession: null,
          previousSession: mostRecent || null,
          nextSession: null,
          totalSessionCount: count,
          pastSessions: allSessions,
          bacTimeSeries: null,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Failed to load current session:', error);
      set({ isLoading: false });
    }
  },

  loadSessionById: async (sessionId: number) => {
    const { profile } = get();
    set({ isNavigating: true });

    try {
      const sessionWithDrinks = await sessionRepository.getSessionWithDrinks(sessionId);

      if (sessionWithDrinks) {
        const adjacent = await sessionRepository.getAdjacentSessions(sessionId);
        const count = await sessionRepository.getSessionCount();

        // Calculate BAC time series
        let bacTimeSeries: BACTimeSeries | null = null;
        if (profile && sessionWithDrinks.drinks.length > 0) {
          bacTimeSeries = calculateBACTimeSeries(sessionWithDrinks.drinks, profile);
        }

        set({
          currentSession: sessionWithDrinks,
          previousSession: adjacent.previous,
          nextSession: adjacent.next,
          totalSessionCount: count,
          bacTimeSeries,
          isNavigating: false,
        });
      } else {
        set({ isNavigating: false });
      }
    } catch (error) {
      console.error('Failed to load session:', error);
      set({ isNavigating: false });
    }
  },

  navigateToPreviousSession: async () => {
    const { previousSession } = get();
    if (previousSession) {
      await get().loadSessionById(previousSession.id);
    }
  },

  navigateToNextSession: async () => {
    const { nextSession, currentSession } = get();
    
    // If we have a next session in the DB, navigate to it
    if (nextSession) {
      await get().loadSessionById(nextSession.id);
    } 
    // If we're viewing a historical session and there's no next session,
    // navigate back to "today" (Welcome Screen or active session)
    else if (currentSession && !isSessionActive(currentSession)) {
      // This session is historical (not active anymore)
      // User wants to go back to "today"
      await get().loadCurrentSession();
    }
  },

  navigateToLatestSession: async () => {
    const mostRecent = await sessionRepository.getMostRecentSession();
    if (mostRecent) {
      await get().loadSessionById(mostRecent.id);
    }
  },

  refreshAfterDrinkChange: async () => {
    const { currentSession, profile } = get();

    if (currentSession) {
      // Reload the session to get updated data
      const updatedSession = await sessionRepository.getSessionWithDrinks(currentSession.id);
      
      // Check if session still has drinks
      if (updatedSession && updatedSession.drinks.length > 0) {
        // Session still has drinks, reload it
        await get().loadSessionById(currentSession.id);
      } else {
        // Session is now empty (all drinks deleted)
        // Check if there's an active session or load current
        const activeSession = await sessionRepository.getActiveSession();
        
        if (activeSession && activeSession.id !== currentSession.id) {
          // There's a different active session, load it
          await get().loadSessionById(activeSession.id);
        } else {
          // No active session, go back to welcome screen
          await get().loadCurrentSession();
        }
      }
    } else {
      // No current session, load whatever is current
      await get().loadCurrentSession();
    }
  },

  initializeSessions: async (profile: UserProfile) => {
    set({ profile, isLoading: true });

    try {
      // Check for drinks without sessions (migration needed)
      await sessionService.migrateExistingDrinksToSessions(profile);

      // Load current session (also loads past sessions)
      await get().loadCurrentSession();
    } catch (error) {
      console.error('Failed to initialize sessions:', error);
      set({ isLoading: false });
    }
  },

  loadPastSessions: async () => {
    try {
      const { currentSession } = get();
      const allSessions = await sessionRepository.getAllSessions();

      // Filter out the current session (if any) from past sessions
      const pastSessions = currentSession
        ? allSessions.filter(s => s.id !== currentSession.id)
        : allSessions;

      set({ pastSessions });
    } catch (error) {
      console.error('Failed to load past sessions:', error);
    }
  },

  // Lightweight refresh that only recalculates BAC without DB queries
  // Used for timer-based updates every minute
  refreshBACOnly: () => {
    const { currentSession, profile } = get();

    if (!currentSession || !profile || currentSession.drinks.length === 0) {
      return;
    }

    // Only recalculate BAC time series with current time
    const bacTimeSeries = calculateBACTimeSeries(currentSession.drinks, profile);
    set({ bacTimeSeries });
  },
}));

// Selector hooks
export const useCurrentSession = () => useSessionStore(state => state.currentSession);
export const useSessionNavigation = () =>
  useSessionStore(
    useShallow(state => {
      // Check if we're viewing an active/current session or a historical one
      const isViewingHistory = state.currentSession !== null && !isSessionActive(state.currentSession);
      
      return {
        previous: state.previousSession,
        next: state.nextSession,
        hasPrevious: state.previousSession !== null,
        // hasNext is true if:
        // 1. There's a next session in the DB, OR
        // 2. We're viewing a historical (inactive) session and can go back to "today"
        hasNext: state.nextSession !== null || isViewingHistory,
        totalCount: state.totalSessionCount,
      };
    })
  );
export const useSessionBAC = () => useSessionStore(state => state.bacTimeSeries);
export const useIsSessionActive = () => useSessionStore(state =>
  state.currentSession ? isSessionActive(state.currentSession) : false
);
export const useSessionLoading = () => useSessionStore(state => state.isLoading || state.isNavigating);
export const usePastSessions = () => useSessionStore(state => state.pastSessions);
