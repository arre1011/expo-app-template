/**
 * Awards Store - Zustand store for Awards System UI state
 *
 * Manages:
 * - Current award states (streaks, milestones)
 * - Loading states
 * - Celebration state (for new milestones)
 *
 * Subscribes to:
 * - sessionsChanged event (triggers recalculation)
 * - goalsChanged event (goals affect streak calculation)
 */

import { create } from 'zustand';
import { AwardId, AwardState, AwardMilestone } from '../../domain/models/types';
import * as awardService from '../../domain/services/awardService';
import { drinkDataEvents } from './drinkDataEvents';

interface AwardsStoreState {
  // Award states (keyed by awardId)
  awards: Record<AwardId, AwardState>;

  // Loading state
  isLoading: boolean;
  isInitialized: boolean;

  // Celebration state (for showing celebration modal)
  pendingCelebration: AwardMilestone | null;

  // Most recent milestone (for widget display)
  mostRecentMilestone: AwardMilestone | null;

  // Actions
  initialize: () => Promise<void>;
  refreshAwards: () => Promise<void>;
  dismissCelebration: () => Promise<void>;
  getLimitKeeperStreak: () => AwardState | null;
}

export const useAwardsStore = create<AwardsStoreState>((set, get) => ({
  awards: {} as Record<AwardId, AwardState>,
  isLoading: false,
  isInitialized: false,
  pendingCelebration: null,
  mostRecentMilestone: null,

  /**
   * Initialize awards on app start.
   * Recalculates all awards and checks for uncelebrated milestones.
   */
  initialize: async () => {
    const { isInitialized, isLoading } = get();

    // Don't initialize twice
    if (isInitialized || isLoading) return;

    set({ isLoading: true });

    try {
      // Recalculate awards from scratch
      const result = await awardService.recalculateAllAwards();

      // Get most recent milestone for widget display
      const mostRecentMilestone = await awardService.getMostRecentMilestone();

      // Check for uncelebrated milestones
      const uncelebrated = await awardService.getUncelebratedMilestones();
      const pendingCelebration = uncelebrated.length > 0 ? uncelebrated[0] : null;

      set({
        awards: result.awards,
        isInitialized: true,
        mostRecentMilestone,
        pendingCelebration,
      });
    } catch (error) {
      console.error('Failed to initialize awards:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * Refresh awards after data changes.
   * Called by event listeners when sessions or goals change.
   */
  refreshAwards: async () => {
    const { isLoading } = get();
    if (isLoading) return;

    set({ isLoading: true });

    try {
      const result = await awardService.recalculateAllAwards();

      // Get most recent milestone
      const mostRecentMilestone = await awardService.getMostRecentMilestone();

      // Check for NEW milestones from this calculation
      const pendingCelebration = result.newMilestones.length > 0
        ? result.newMilestones[0]
        : get().pendingCelebration;

      set({
        awards: result.awards,
        mostRecentMilestone,
        pendingCelebration,
      });
    } catch (error) {
      console.error('Failed to refresh awards:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * Dismiss celebration modal and mark milestone as celebrated.
   */
  dismissCelebration: async () => {
    const { pendingCelebration } = get();

    if (pendingCelebration) {
      await awardService.markMilestoneCelebrated(pendingCelebration.id);
    }

    // Check for more uncelebrated milestones
    const uncelebrated = await awardService.getUncelebratedMilestones();
    const nextCelebration = uncelebrated.length > 0 ? uncelebrated[0] : null;

    set({ pendingCelebration: nextCelebration });
  },

  /**
   * Get the limit_keeper award state (convenience method for widget).
   */
  getLimitKeeperStreak: () => {
    const { awards } = get();
    return awards['limit_keeper'] ?? null;
  },
}));

// ============================================================================
// Event Subscriptions
// ============================================================================

// Subscribe to session changes - recalculate awards
drinkDataEvents.on('sessionsChanged', () => {
  const { isInitialized } = useAwardsStore.getState();
  if (isInitialized) {
    useAwardsStore.getState().refreshAwards();
  }
});

// Subscribe to goal changes - goals affect streak calculation
drinkDataEvents.on('goalsChanged', () => {
  const { isInitialized } = useAwardsStore.getState();
  if (isInitialized) {
    useAwardsStore.getState().refreshAwards();
  }
});

// ============================================================================
// Selector Hooks (for optimized component subscriptions)
// ============================================================================

/**
 * Get limit_keeper award state with automatic subscription.
 * Use this in components that only need the limit_keeper streak.
 */
export function useLimitKeeperStreak(): AwardState | null {
  return useAwardsStore(state => state.awards['limit_keeper'] ?? null);
}

/**
 * Get mindful_drinker award state with automatic subscription.
 * Use this in components that only need the mindful_drinker streak.
 */
export function useMindfulDrinkerStreak(): AwardState | null {
  return useAwardsStore(state => state.awards['mindful_drinker'] ?? null);
}

/**
 * Get all awards with automatic subscription.
 */
export function useAllAwards(): Record<AwardId, AwardState> {
  return useAwardsStore(state => state.awards);
}

/**
 * Get pending celebration milestone.
 */
export function usePendingCelebration(): AwardMilestone | null {
  return useAwardsStore(state => state.pendingCelebration);
}

/**
 * Get most recent milestone.
 */
export function useMostRecentMilestone(): AwardMilestone | null {
  return useAwardsStore(state => state.mostRecentMilestone);
}

/**
 * Get loading state.
 */
export function useAwardsLoading(): boolean {
  return useAwardsStore(state => state.isLoading);
}
