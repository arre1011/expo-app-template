import { create } from 'zustand';
import { DayStatus, MoodType } from './types';
import { getJournalEntriesForRange } from './data/journalEntryRepository';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

export interface CalendarDay {
  date: Date;
  dateString: string;
  status: DayStatus;
}

type CalendarViewMode = 'year' | 'month';

function moodToDayStatus(mood: MoodType | null): DayStatus {
  if (!mood) return 'no_data';
  return mood; // 'good' | 'moderate' | 'bad' maps directly
}

interface CalendarState {
  viewMode: CalendarViewMode;
  selectedYear: number;
  selectedMonth: number;
  monthDays: CalendarDay[];
  isLoading: boolean;

  setViewMode: (mode: CalendarViewMode) => void;
  setYear: (year: number) => void;
  setMonth: (year: number, month: number) => void;
  navigateToMonth: (month: number) => void;
  navigateToYear: () => void;
  loadMonthData: () => Promise<void>;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  goToToday: () => void;
  refresh: () => void;
}

export const useCalendarStore = create<CalendarState>((set, get) => {
  const now = new Date();

  return {
    viewMode: 'year' as CalendarViewMode,
    selectedYear: now.getFullYear(),
    selectedMonth: now.getMonth() + 1,
    monthDays: [],
    isLoading: false,

    setViewMode: (mode) => set({ viewMode: mode }),

    setYear: (year) => set({ selectedYear: year }),

    setMonth: (year, month) => {
      set({ selectedYear: year, selectedMonth: month });
      get().loadMonthData();
    },

    navigateToMonth: (month) => {
      set({ selectedMonth: month, viewMode: 'month' });
      get().loadMonthData();
    },

    navigateToYear: () => set({ viewMode: 'year' }),

    loadMonthData: async () => {
      const { selectedYear, selectedMonth } = get();
      set({ isLoading: true });

      try {
        const monthStart = startOfMonth(new Date(selectedYear, selectedMonth - 1));
        const monthEnd = endOfMonth(monthStart);

        const entries = await getJournalEntriesForRange(monthStart, monthEnd);
        const entryMap = new Map(entries.map(e => [e.date, e]));

        const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
        const monthDays: CalendarDay[] = days.map(date => {
          const dateString = format(date, 'yyyy-MM-dd');
          const entry = entryMap.get(dateString);
          return {
            date,
            dateString,
            status: entry ? moodToDayStatus(entry.mood) : 'no_data',
          };
        });

        set({ monthDays, isLoading: false });
      } catch (error) {
        console.error('Failed to load month data:', error);
        set({ isLoading: false });
      }
    },

    goToPreviousMonth: () => {
      const { selectedYear, selectedMonth } = get();
      if (selectedMonth === 1) get().setMonth(selectedYear - 1, 12);
      else get().setMonth(selectedYear, selectedMonth - 1);
    },

    goToNextMonth: () => {
      const { selectedYear, selectedMonth } = get();
      if (selectedMonth === 12) get().setMonth(selectedYear + 1, 1);
      else get().setMonth(selectedYear, selectedMonth + 1);
    },

    goToToday: () => {
      const now = new Date();
      get().setMonth(now.getFullYear(), now.getMonth() + 1);
    },

    refresh: () => get().loadMonthData(),
  };
});
