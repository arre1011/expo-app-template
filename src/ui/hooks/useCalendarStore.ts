import { create } from 'zustand';
import { DrinkEntry, DailyGoal, DayStatus, Session } from '../../domain/models/types';
import { getDrinkEntriesForDay, getEarliestDrinkTimestamp } from '../../data/repositories/drinkEntryRepository';
import { getDailyGoalsForMonth, getDailyGoalForDate } from '../../data/repositories/dailyGoalRepository';
import { getSessionsForMonth } from '../../data/repositories/sessionRepository';
import { getUserProfile } from '../../data/repositories/userProfileRepository';
import { getDayStatusBySession } from '../../domain/services/statistics';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { drinkDataEvents } from './drinkDataEvents';

interface CalendarDay {
  date: Date;
  dateString: string;
  drinkCount: number;
  status: DayStatus;
}

type CalendarViewMode = 'year' | 'month';

interface CalendarState {
  // View mode
  viewMode: CalendarViewMode;
  selectedYear: number;
  selectedMonth: number;
  monthDays: CalendarDay[];
  monthSessions: Session[];
  monthGoals: DailyGoal[];
  isLoading: boolean;

  // Selected day detail
  selectedDate: Date | null;
  selectedDayDrinks: DrinkEntry[];
  selectedDayGoal: DailyGoal | null;

  // Actions
  setViewMode: (mode: CalendarViewMode) => void;
  setYear: (year: number) => void;
  setMonth: (year: number, month: number) => void;
  navigateToMonth: (month: number) => void;
  navigateToYear: () => void;
  loadMonthData: () => Promise<void>;
  selectDay: (date: Date) => Promise<void>;
  clearSelection: () => void;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  goToToday: () => void;
}

export const useCalendarStore = create<CalendarState>((set, get) => {
  const now = new Date();

  return {
    viewMode: 'year' as CalendarViewMode,
    selectedYear: now.getFullYear(),
    selectedMonth: now.getMonth() + 1,
    monthDays: [],
    monthSessions: [],
    monthGoals: [],
    isLoading: false,
    selectedDate: null,
    selectedDayDrinks: [],
    selectedDayGoal: null,

    setViewMode: (mode: CalendarViewMode) => {
      set({ viewMode: mode });
    },

    setYear: (year: number) => {
      set({ selectedYear: year });
    },

    setMonth: (year: number, month: number) => {
      set({ selectedYear: year, selectedMonth: month });
      get().loadMonthData();
    },

    navigateToMonth: (month: number) => {
      const { selectedYear } = get();
      set({ selectedMonth: month, viewMode: 'month' });
      get().loadMonthData();
    },

    navigateToYear: () => {
      set({ viewMode: 'year' });
    },

    loadMonthData: async () => {
      const { selectedYear, selectedMonth } = get();
      set({ isLoading: true });

      try {
        const [sessions, goals, earliestDrinkTimestamp, profile] = await Promise.all([
          getSessionsForMonth(selectedYear, selectedMonth),
          getDailyGoalsForMonth(selectedYear, selectedMonth),
          getEarliestDrinkTimestamp(),
          getUserProfile(),
        ]);

        // Determine journey start date: earliest of profile creation and first drink
        let journeyStartDate: Date | null = null;
        const candidateDates: Date[] = [];
        if (earliestDrinkTimestamp) candidateDates.push(new Date(earliestDrinkTimestamp));
        if (profile?.createdAt) candidateDates.push(new Date(profile.createdAt));
        if (candidateDates.length > 0) {
          journeyStartDate = candidateDates.reduce((min, d) => (d < min ? d : min));
        }

        // Calculate day statuses based on sessions that STARTED on each day
        const monthStart = startOfMonth(new Date(selectedYear, selectedMonth - 1));
        const monthEnd = endOfMonth(monthStart);
        const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

        // Convert sessions to SessionInfo for status calculation
        const sessionInfos = sessions.map(s => ({
          startTime: s.startTime,
          peakBAC: s.peakBAC,
        }));

        const monthDays: CalendarDay[] = days.map(date => {
          const dateString = format(date, 'yyyy-MM-dd');
          const dayGoal = goals.find(g => g.date === dateString) || null;

          // Count drinks for the day (sum of drinks in sessions that started on this day)
          const daySessions = sessions.filter(s => {
            const sessionStartDate = format(new Date(s.startTime), 'yyyy-MM-dd');
            return sessionStartDate === dateString;
          });

          // Use session-based status calculation, respecting journey start date
          const status = getDayStatusBySession(sessionInfos, dayGoal, date, journeyStartDate);

          return {
            date,
            dateString,
            drinkCount: daySessions.length, // Number of sessions, not drinks
            status,
          };
        });

        set({
          monthSessions: sessions,
          monthGoals: goals,
          monthDays,
          isLoading: false,
        });
      } catch (error) {
        console.error('Failed to load month data:', error);
        set({ isLoading: false });
      }
    },

    selectDay: async (date: Date) => {
      try {
        const [drinks, goal] = await Promise.all([
          getDrinkEntriesForDay(date),
          getDailyGoalForDate(date),
        ]);

        set({
          selectedDate: date,
          selectedDayDrinks: drinks,
          selectedDayGoal: goal,
        });
      } catch (error) {
        console.error('Failed to load day data:', error);
      }
    },

    clearSelection: () => {
      set({
        selectedDate: null,
        selectedDayDrinks: [],
        selectedDayGoal: null,
      });
    },

    goToPreviousMonth: () => {
      const { selectedYear, selectedMonth } = get();
      if (selectedMonth === 1) {
        get().setMonth(selectedYear - 1, 12);
      } else {
        get().setMonth(selectedYear, selectedMonth - 1);
      }
    },

    goToNextMonth: () => {
      const { selectedYear, selectedMonth } = get();
      if (selectedMonth === 12) {
        get().setMonth(selectedYear + 1, 1);
      } else {
        get().setMonth(selectedYear, selectedMonth + 1);
      }
    },

    goToToday: () => {
      const now = new Date();
      get().setMonth(now.getFullYear(), now.getMonth() + 1);
    },
  };
});

// Subscribe to drink and session changes to keep calendar in sync
drinkDataEvents.on('drinksChanged', () => {
  useCalendarStore.getState().loadMonthData();
});

drinkDataEvents.on('sessionsChanged', () => {
  useCalendarStore.getState().loadMonthData();
});

// Reload when a goal/limit changes so calendar day colors update
drinkDataEvents.on('goalsChanged', () => {
  useCalendarStore.getState().loadMonthData();
});
