import { create } from 'zustand';
import {
  UserProfile,
  DrinkEntry,
  DailyGoal,
  BACTimeSeries,
  CreateUserProfile,
  UpdateUserProfile,
  CreateDrinkEntry,
  RecentDrinkTemplate,
  CustomDrink,
  CreateCustomDrink,
} from '../../domain/models/types';
import {
  getUserProfile,
  createUserProfile,
  updateUserProfile,
  hasUserProfile,
} from '../../data/repositories/userProfileRepository';
import {
  getTodayDrinkEntries,
  createDrinkEntry,
  updateDrinkEntry,
  deleteDrinkEntry,
  getDrinkEntriesForDay,
  getDrinkEntriesForLastDays,
  getRecentDrinkTemplates,
} from '../../data/repositories/drinkEntryRepository';
import * as sessionService from '../../domain/services/sessionService';
import {
  getTodayGoal,
  setTodayGoal,
  getDailyGoalForDate,
  getDefaultGoalSettings,
} from '../../data/repositories/dailyGoalRepository';
import { evaluateLimitWarning, LimitWarningResult } from '../../domain/services/limitWarningService';
import { calculateBACTimeSeries, filterDrinksToCurrentSession } from '../../domain/services/bacCalculator';
import { DEFAULT_DAILY_GOAL } from '../../domain/constants/defaults';
import { format } from 'date-fns';
import { drinkDataEvents } from './drinkDataEvents';
import {
  getFavoriteDrinkIds,
  toggleFavorite as toggleFavoriteInDb,
} from '../../data/repositories/favoriteDrinkRepository';
import {
  getAllCustomDrinks,
  createCustomDrink,
  deleteCustomDrink,
} from '../../data/repositories/customDrinkRepository';

interface AppState {
  // User profile
  profile: UserProfile | null;
  hasProfile: boolean;
  isProfileLoading: boolean;

  // Today's data
  todayDrinks: DrinkEntry[]; // Only drinks from today (for goal tracking)
  sessionDrinks: DrinkEntry[]; // Drinks from current session (for BAC calculation)
  todayGoal: DailyGoal | null;
  bacTimeSeries: BACTimeSeries | null;
  isTodayLoading: boolean;

  // Recent drinks for Quick-Add
  recentDrinkTemplates: RecentDrinkTemplate[];
  isRecentLoading: boolean;

  // Favorites and Custom Drinks (DrinkPicker)
  favoriteDrinkIds: string[];
  customDrinks: CustomDrink[];
  isFavoritesLoading: boolean;
  isCustomDrinksLoading: boolean;

  // UI state
  isAddDrinkModalOpen: boolean;
  pendingDrink: CreateDrinkEntry | null;
  limitWarning: LimitWarningResult | null;

  // Actions
  loadProfile: () => Promise<void>;
  saveProfile: (data: CreateUserProfile) => Promise<void>;
  updateProfile: (data: UpdateUserProfile) => Promise<void>;

  loadTodayData: () => Promise<void>;
  addDrink: (drink: CreateDrinkEntry) => Promise<void>;
  updateDrink: (id: number, drink: CreateDrinkEntry) => Promise<void>;
  removeDrink: (id: number) => Promise<void>;
  confirmPendingDrink: () => Promise<void>;
  cancelPendingDrink: () => void;
  saveDrinkDirectly: (drink: CreateDrinkEntry) => Promise<void>;

  // Recent drinks actions
  loadRecentDrinks: () => Promise<void>;
  quickAddDrink: (template: RecentDrinkTemplate) => Promise<void>;

  // Favorites and Custom Drinks actions
  loadFavorites: () => Promise<void>;
  toggleFavorite: (drinkId: string) => Promise<void>;
  loadCustomDrinks: () => Promise<void>;
  addCustomDrink: (drink: CreateCustomDrink) => Promise<CustomDrink>;
  removeCustomDrink: (id: number) => Promise<void>;

  setTodayGoal: (maxBAC: number, enabled?: boolean) => Promise<void>;

  openAddDrinkModal: () => void;
  closeAddDrinkModal: () => void;

  recalculateBAC: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  profile: null,
  hasProfile: false,
  isProfileLoading: true,
  todayDrinks: [],
  sessionDrinks: [],
  todayGoal: null,
  bacTimeSeries: null,
  isTodayLoading: true,
  recentDrinkTemplates: [],
  isRecentLoading: false,
  favoriteDrinkIds: [],
  customDrinks: [],
  isFavoritesLoading: false,
  isCustomDrinksLoading: false,
  isAddDrinkModalOpen: false,
  pendingDrink: null,
  limitWarning: null,

  // Profile actions
  loadProfile: async () => {
    set({ isProfileLoading: true });
    try {
      const profile = await getUserProfile();
      const has = await hasUserProfile();
      set({ profile, hasProfile: has, isProfileLoading: false });
    } catch (error) {
      console.error('Failed to load profile:', error);
      set({ isProfileLoading: false });
    }
  },

  saveProfile: async (data: CreateUserProfile) => {
    try {
      const profile = await createUserProfile(data);
      set({ profile, hasProfile: true });
    } catch (error) {
      console.error('Failed to save profile:', error);
      throw error;
    }
  },

  updateProfile: async (data: UpdateUserProfile) => {
    const { profile } = get();
    if (!profile) return;

    try {
      const updated = await updateUserProfile(profile.id, data);
      if (updated) {
        set({ profile: updated });
        get().recalculateBAC();
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  },

  // Today data actions
  loadTodayData: async () => {
    set({ isTodayLoading: true });
    try {
      const { profile } = get();

      // Load today's drinks for goal tracking
      // Load drinks from last 3 days for session calculation (covers long drinking sessions)
      const [todayDrinks, recentDrinks, goal] = await Promise.all([
        getTodayDrinkEntries(),
        getDrinkEntriesForLastDays(3),
        getTodayGoal(),
      ]);

      // If no explicit goal for today, use the most recently set limit as default.
      // This ensures the user's chosen limit carries over to new days and overnight sessions.
      let effectiveGoal = goal;
      if (!goal) {
        const defaults = await getDefaultGoalSettings();
        effectiveGoal = {
          id: 0,
          date: format(new Date(), 'yyyy-MM-dd'),
          maxBAC: defaults.maxBAC,
          enabled: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      // Calculate session drinks (drinks contributing to current BAC)
      let sessionDrinks: DrinkEntry[] = [];
      if (profile && recentDrinks.length > 0) {
        sessionDrinks = filterDrinksToCurrentSession(recentDrinks, profile);
      }

      set({
        todayDrinks,
        sessionDrinks,
        todayGoal: effectiveGoal,
        isTodayLoading: false,
      });

      get().recalculateBAC();
    } catch (error) {
      console.error('Failed to load today data:', error);
      set({ isTodayLoading: false });
    }
  },

  addDrink: async (drink: CreateDrinkEntry) => {
    const { profile } = get();

    if (!profile) {
      throw new Error('Profile required to add drink');
    }

    // CRITICAL: Load fresh data from DB to ensure we have the latest drinks
    // This prevents the bug where drinks appear to be deleted when the modal is opened
    const drinkTimestamp = new Date(drink.timestamp);
    const dayDrinks = await getDrinkEntriesForDay(drinkTimestamp);
    const dayGoal = await getDailyGoalForDate(drinkTimestamp);

    // Use dayGoal if set, otherwise use the most recently set limit as default
    let goalToUse = dayGoal;
    if (!goalToUse) {
      const defaults = await getDefaultGoalSettings();
      goalToUse = {
        id: 0,
        date: format(drinkTimestamp, 'yyyy-MM-dd'),
        maxBAC: defaults.maxBAC,
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    // Evaluate limit warning with the new service
    const warningResult = evaluateLimitWarning(dayDrinks, goalToUse, profile, drink);

    // ONLY for will_exceed_limit: Need confirmation before saving
    if (warningResult.type === 'will_exceed_limit') {
      // Store pending drink and warning result for confirmation popup
      set({
        pendingDrink: drink,
        limitWarning: warningResult,
      });
      return; // Don't save yet - wait for user confirmation
    }

    // For 'none', 'approaching_limit', and 'predictive_warning': Save immediately
    await get().saveDrinkDirectly(drink);

    // AFTER saving: If predictive_warning, show informational popup
    if (warningResult.type === 'predictive_warning') {
      set({ limitWarning: warningResult }); // Popup will show, but drink is already saved!
    }
  },

  confirmPendingDrink: async () => {
    const { pendingDrink } = get();
    if (!pendingDrink) return;

    // Clear the pending state BEFORE save to prevent race condition
    const drinkToSave = pendingDrink;
    set({
      pendingDrink: null,
      limitWarning: null,
    });

    // Save the drink
    await get().saveDrinkDirectly(drinkToSave);
  },

  saveDrinkDirectly: async (drink: CreateDrinkEntry) => {
    const { profile } = get();

    try {
      // Write to DB (Single Source of Truth)
      const savedDrink = await createDrinkEntry(drink);

      // Process drink for session assignment
      if (profile) {
        await sessionService.processNewDrink(savedDrink, profile);
        drinkDataEvents.notifySessionsChanged();
      }

      // Reload complete state from DB instead of manual state updates
      // This ensures consistency and prevents stale state issues
      await get().loadTodayData();

      // Reload recent drinks to update Quick Add section
      await get().loadRecentDrinks();

      // Notify all listeners that drinks changed (Calendar, Statistics, etc.)
      drinkDataEvents.notifyDrinksChanged();
    } catch (error) {
      console.error('Failed to add drink:', error);
      throw error;
    }
  },

  cancelPendingDrink: () => {
    set({
      pendingDrink: null,
      limitWarning: null,
    });
  },

  updateDrink: async (id: number, drink: CreateDrinkEntry) => {
    const { profile } = get();

    try {
      // Update in DB (Single Source of Truth)
      await updateDrinkEntry(id, {
        timestamp: drink.timestamp,
        type: drink.type,
        volumeMl: drink.volumeMl,
        abvPercent: drink.abvPercent,
        label: drink.label,
        notes: drink.notes,
      });

      // Recalculate sessions after drink update
      if (profile) {
        await sessionService.recalculateAllSessions(profile);
        drinkDataEvents.notifySessionsChanged();
      }

      // Reload complete state from DB instead of manual state updates
      await get().loadTodayData();

      // Reload recent drinks to update Quick Add section
      await get().loadRecentDrinks();

      // Notify all listeners that drinks changed
      drinkDataEvents.notifyDrinksChanged();
    } catch (error) {
      console.error('Failed to update drink:', error);
      throw error;
    }
  },

  removeDrink: async (id: number) => {
    const { profile } = get();

    try {
      // STEP 1: Delete the drink from DB first
      await deleteDrinkEntry(id);

      // STEP 2: Recalculate all sessions (drink is now gone from DB)
      if (profile) {
        await sessionService.recalculateAllSessions(profile);
        drinkDataEvents.notifySessionsChanged();
      }

      // Reload complete state from DB instead of manual state updates
      // This ensures consistency and prevents stale state issues
      await get().loadTodayData();

      // Reload recent drinks to update Quick Add section
      await get().loadRecentDrinks();

      // Notify all listeners that drinks changed (Calendar, Statistics, etc.)
      drinkDataEvents.notifyDrinksChanged();
    } catch (error) {
      console.error('Failed to remove drink:', error);
      throw error;
    }
  },

  setTodayGoal: async (maxBAC: number, enabled: boolean = true) => {
    try {
      const goal = await setTodayGoal(maxBAC, enabled);
      set({ todayGoal: goal });
      drinkDataEvents.notifyGoalsChanged();
    } catch (error) {
      console.error('Failed to set goal:', error);
      throw error;
    }
  },

  // Recent drinks actions
  loadRecentDrinks: async () => {
    set({ isRecentLoading: true });
    try {
      const templates = await getRecentDrinkTemplates(10, 30);
      set({ recentDrinkTemplates: templates, isRecentLoading: false });
    } catch (error) {
      console.error('Failed to load recent drinks:', error);
      set({ isRecentLoading: false });
    }
  },

  quickAddDrink: async (template: RecentDrinkTemplate) => {
    const drink: CreateDrinkEntry = {
      type: template.type,
      volumeMl: template.volumeMl,
      abvPercent: template.abvPercent,
      label: template.label,
      notes: null,
      timestamp: new Date().toISOString(),
    };

    // Use existing addDrink flow (handles goal checking)
    // Note: saveDrinkDirectly already calls loadRecentDrinks()
    await get().addDrink(drink);
  },

  // Favorites actions
  loadFavorites: async () => {
    set({ isFavoritesLoading: true });
    try {
      const ids = await getFavoriteDrinkIds();
      set({ favoriteDrinkIds: ids, isFavoritesLoading: false });
    } catch (error) {
      console.error('Failed to load favorites:', error);
      set({ isFavoritesLoading: false });
    }
  },

  toggleFavorite: async (drinkId: string) => {
    try {
      const isFav = await toggleFavoriteInDb(drinkId);
      // Update local state
      set(state => ({
        favoriteDrinkIds: isFav
          ? [...state.favoriteDrinkIds, drinkId]
          : state.favoriteDrinkIds.filter(id => id !== drinkId),
      }));
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      throw error;
    }
  },

  // Custom drinks actions
  loadCustomDrinks: async () => {
    set({ isCustomDrinksLoading: true });
    try {
      const drinks = await getAllCustomDrinks();
      set({ customDrinks: drinks, isCustomDrinksLoading: false });
    } catch (error) {
      console.error('Failed to load custom drinks:', error);
      set({ isCustomDrinksLoading: false });
    }
  },

  addCustomDrink: async (drink: CreateCustomDrink) => {
    try {
      const created = await createCustomDrink(drink);
      set(state => ({
        customDrinks: [...state.customDrinks, created],
      }));
      return created;
    } catch (error) {
      console.error('Failed to add custom drink:', error);
      throw error;
    }
  },

  removeCustomDrink: async (id: number) => {
    try {
      await deleteCustomDrink(id);
      set(state => ({
        customDrinks: state.customDrinks.filter(d => d.id !== id),
      }));
    } catch (error) {
      console.error('Failed to remove custom drink:', error);
      throw error;
    }
  },

  // UI actions
  openAddDrinkModal: () => set({ isAddDrinkModalOpen: true }),
  closeAddDrinkModal: () => set({ isAddDrinkModalOpen: false }),

  // BAC calculation
  recalculateBAC: () => {
    const { profile, sessionDrinks } = get();

    if (!profile || sessionDrinks.length === 0) {
      set({ bacTimeSeries: null });
      return;
    }

    // Use sessionDrinks for BAC calculation (includes drinks from previous days if still in session)
    const timeSeries = calculateBACTimeSeries(sessionDrinks, profile);
    set({ bacTimeSeries: timeSeries });
  },
}));

// Reload todayGoal when any goal changes (e.g. limit edited via calendar day detail)
drinkDataEvents.on('goalsChanged', () => {
  useAppStore.getState().loadTodayData();
});

// Selector hooks for specific pieces of state
export const useProfile = () => useAppStore(state => state.profile);
export const useHasProfile = () => useAppStore(state => state.hasProfile);
export const useTodayDrinks = () => useAppStore(state => state.todayDrinks);
export const useSessionDrinks = () => useAppStore(state => state.sessionDrinks);
export const useTodayGoal = () => useAppStore(state => state.todayGoal);
export const useBACTimeSeries = () => useAppStore(state => state.bacTimeSeries);
export const useIsLoading = () => useAppStore(state => state.isProfileLoading || state.isTodayLoading);
export const useRecentDrinkTemplates = () => useAppStore(state => state.recentDrinkTemplates);
export const useIsRecentLoading = () => useAppStore(state => state.isRecentLoading);
export const useFavoriteDrinkIds = () => useAppStore(state => state.favoriteDrinkIds);
export const useCustomDrinks = () => useAppStore(state => state.customDrinks);
export const useIsFavoritesLoading = () => useAppStore(state => state.isFavoritesLoading);
export const useIsCustomDrinksLoading = () => useAppStore(state => state.isCustomDrinksLoading);

// Unit preference selectors
export const useBACUnit = () => useAppStore(state => state.profile?.bacUnit ?? 'percent');
export const useWeightUnit = () => useAppStore(state => state.profile?.weightUnit ?? 'lb');
export const useVolumeUnit = () => useAppStore(state => state.profile?.volumeUnit ?? 'oz');

