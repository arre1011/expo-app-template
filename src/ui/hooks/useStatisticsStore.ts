import { create } from 'zustand';
import {
  PeriodStats,
  DrinkEntry,
  UserProfile,
  ChartPeriodType,
  ChartBarData,
  ChartXAxisTick,
  ChartData,
} from '../../domain/models/types';
import { getDrinkEntriesForRange } from '../../data/repositories/drinkEntryRepository';
import { getDailyGoalsForRange } from '../../data/repositories/dailyGoalRepository';
import { getUserProfile } from '../../data/repositories/userProfileRepository';
import { getSessionsForDateRange } from '../../data/repositories/sessionRepository';
import { calculatePeriodStats } from '../../domain/services/statistics';
import {
  calculateTotalStandardUnits,
  calculateTotalAlcoholGrams,
} from '../../domain/services/bacCalculator';
import { drinkDataEvents } from './drinkDataEvents';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addWeeks,
  addMonths,
  addDays,
  eachDayOfInterval,
  eachWeekOfInterval,
  format,
  getWeek,
  getYear,
  getHours,
  isWithinInterval,
  startOfDay,
  endOfDay,
  getDay,
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds,
} from 'date-fns';
import { de } from 'date-fns/locale';

interface StatisticsState {
  periodType: ChartPeriodType;
  /** Offset from current period (0 = current, -1 = previous, etc.) */
  periodOffset: number;
  stats: PeriodStats | null;
  chartData: ChartData | null;
  isLoading: boolean;
  profile: UserProfile | null;
  /** Currently selected bar index for detail view */
  selectedBarIndex: number | null;

  // Actions
  setPeriodType: (type: ChartPeriodType) => void;
  navigatePeriod: (direction: 'prev' | 'next') => void;
  goToCurrentPeriod: () => void;
  selectBar: (index: number | null) => void;
  loadStats: () => Promise<void>;
}

/**
 * Get drinks for a specific day from an array
 */
function getDrinksForDay(drinks: DrinkEntry[], date: Date): DrinkEntry[] {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);
  return drinks.filter(drink => {
    const drinkDate = new Date(drink.timestamp);
    return isWithinInterval(drinkDate, { start: dayStart, end: dayEnd });
  });
}

/**
 * Get drinks for a date range from an array
 */
function getDrinksForRange(drinks: DrinkEntry[], start: Date, end: Date): DrinkEntry[] {
  return drinks.filter(drink => {
    const drinkDate = new Date(drink.timestamp);
    return isWithinInterval(drinkDate, { start: startOfDay(start), end: endOfDay(end) });
  });
}

/**
 * Get drinks for a specific hour range
 */
function getDrinksForHour(drinks: DrinkEntry[], date: Date, hour: number): DrinkEntry[] {
  const hourStart = setMilliseconds(setSeconds(setMinutes(setHours(date, hour), 0), 0), 0);
  const hourEnd = setMilliseconds(setSeconds(setMinutes(setHours(date, hour), 59), 59), 999);
  return drinks.filter(drink => {
    const drinkDate = new Date(drink.timestamp);
    return isWithinInterval(drinkDate, { start: hourStart, end: hourEnd });
  });
}

/**
 * Calculate period boundaries based on type and offset
 */
function calculatePeriodBoundaries(
  periodType: ChartPeriodType,
  offset: number
): { startDate: Date; endDate: Date } {
  const now = new Date();
  let startDate: Date;
  let endDate: Date;

  switch (periodType) {
    case 'day': {
      const baseDay = startOfDay(now);
      startDate = addDays(baseDay, offset);
      endDate = endOfDay(startDate);
      break;
    }
    case 'week': {
      const baseWeekStart = startOfWeek(now, { weekStartsOn: 1 });
      startDate = addWeeks(baseWeekStart, offset);
      endDate = endOfWeek(startDate, { weekStartsOn: 1 });
      break;
    }
    case 'month': {
      const baseMonthStart = startOfMonth(now);
      startDate = addMonths(baseMonthStart, offset);
      endDate = endOfMonth(startDate);
      break;
    }
    case 'sixMonth': {
      // 6 months back from end of current month, then apply offset
      const baseEnd = endOfMonth(now);
      endDate = addMonths(baseEnd, offset * 6);
      startDate = addMonths(startOfMonth(endDate), -5);
      startDate = startOfMonth(startDate);
      break;
    }
    case 'year': {
      const currentYear = now.getFullYear();
      const targetYear = currentYear + offset;
      startDate = new Date(targetYear, 0, 1);
      endDate = new Date(targetYear, 11, 31, 23, 59, 59, 999);
      break;
    }
  }

  return { startDate, endDate };
}

/**
 * Generate chart data for daily view (24 bars, one per hour)
 * X-axis shows 00, 06, 12, 18 as tick marks
 */
function generateDailyChartData(
  drinks: DrinkEntry[],
  date: Date
): ChartData {
  const bars: ChartBarData[] = [];

  for (let hour = 0; hour < 24; hour++) {
    const hourStart = setMilliseconds(setSeconds(setMinutes(setHours(date, hour), 0), 0), 0);
    const hourEnd = setMilliseconds(setSeconds(setMinutes(setHours(date, hour), 59), 59), 999);
    const hourDrinks = getDrinksForHour(drinks, date, hour);
    const su = calculateTotalStandardUnits(hourDrinks);
    const grams = calculateTotalAlcoholGrams(hourDrinks);

    const hourLabel = hour.toString().padStart(2, '0');

    bars.push({
      id: `${format(date, 'yyyy-MM-dd')}-${hourLabel}`,
      standardUnits: Math.round(su * 10) / 10,
      alcoholGrams: Math.round(grams * 10) / 10,
      label: hourLabel,
      fullLabel: `${hourLabel}:00 – ${hourLabel}:59 Uhr`,
      startDate: hourStart,
      endDate: hourEnd,
      drinkCount: hourDrinks.length,
    });
  }

  // X-axis ticks: show only 00, 06, 12, 18
  const tickHours = [0, 6, 12, 18];
  const xAxisTicks: ChartXAxisTick[] = tickHours.map(hour => ({
    barIndex: hour,
    label: hour.toString().padStart(2, '0'),
  }));

  const maxValue = Math.max(...bars.map(b => b.alcoholGrams), 1);

  return {
    bars,
    xAxisTicks,
    maxValue,
    periodTitle: format(date, 'EEEE', { locale: de }),
    periodSubtitle: format(date, 'd. MMMM yyyy', { locale: de }),
  };
}

/**
 * Generate chart data for weekly view (7 bars, one per day)
 */
function generateWeeklyChartData(
  drinks: DrinkEntry[],
  startDate: Date,
  endDate: Date
): ChartData {
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const bars: ChartBarData[] = days.map(day => {
    const dayDrinks = getDrinksForDay(drinks, day);
    const su = calculateTotalStandardUnits(dayDrinks);
    const grams = calculateTotalAlcoholGrams(dayDrinks);

    return {
      id: format(day, 'yyyy-MM-dd'),
      standardUnits: Math.round(su * 10) / 10,
      alcoholGrams: Math.round(grams * 10) / 10,
      label: format(day, 'EEEEEE', { locale: de }), // Mo, Di, Mi, ...
      fullLabel: format(day, 'EEEE, d. MMMM', { locale: de }),
      startDate: startOfDay(day),
      endDate: endOfDay(day),
      drinkCount: dayDrinks.length,
    };
  });

  // X-axis ticks: show all days for weekly view
  const xAxisTicks: ChartXAxisTick[] = bars.map((bar, index) => ({
    barIndex: index,
    label: bar.label,
  }));

  const maxValue = Math.max(...bars.map(b => b.alcoholGrams), 1);
  const weekNumber = getWeek(startDate, { weekStartsOn: 1 });
  const year = getYear(startDate);

  return {
    bars,
    xAxisTicks,
    maxValue,
    periodTitle: `KW ${weekNumber}`,
    periodSubtitle: `${format(startDate, 'd. MMM', { locale: de })} – ${format(endDate, 'd. MMM yyyy', { locale: de })}`,
  };
}

/**
 * Generate chart data for monthly view (28-31 bars, one per day)
 * X-axis shows only Mondays as tick marks
 */
function generateMonthlyChartData(
  drinks: DrinkEntry[],
  startDate: Date,
  endDate: Date
): ChartData {
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const bars: ChartBarData[] = days.map(day => {
    const dayDrinks = getDrinksForDay(drinks, day);
    const su = calculateTotalStandardUnits(dayDrinks);
    const grams = calculateTotalAlcoholGrams(dayDrinks);

    return {
      id: format(day, 'yyyy-MM-dd'),
      standardUnits: Math.round(su * 10) / 10,
      alcoholGrams: Math.round(grams * 10) / 10,
      label: format(day, 'd'),
      fullLabel: format(day, 'EEEE, d. MMMM', { locale: de }),
      startDate: startOfDay(day),
      endDate: endOfDay(day),
      drinkCount: dayDrinks.length,
    };
  });

  // X-axis ticks: only show Mondays (tick-strategy like Apple Health)
  const xAxisTicks: ChartXAxisTick[] = [];
  days.forEach((day, index) => {
    // getDay returns 0 for Sunday, 1 for Monday
    if (getDay(day) === 1) {
      xAxisTicks.push({
        barIndex: index,
        label: format(day, 'd'),
      });
    }
  });

  const maxValue = Math.max(...bars.map(b => b.alcoholGrams), 1);

  return {
    bars,
    xAxisTicks,
    maxValue,
    periodTitle: format(startDate, 'MMMM yyyy', { locale: de }),
    periodSubtitle: `${days.length} Tage`,
  };
}

/**
 * Generate chart data for six-month view (one bar per week)
 */
function generateSixMonthChartData(
  drinks: DrinkEntry[],
  startDate: Date,
  endDate: Date
): ChartData {
  // Get all weeks in the range
  const weeks = eachWeekOfInterval(
    { start: startDate, end: endDate },
    { weekStartsOn: 1 }
  );

  const bars: ChartBarData[] = weeks.map(weekStart => {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    // Clamp to period boundaries
    const actualStart = weekStart < startDate ? startDate : weekStart;
    const actualEnd = weekEnd > endDate ? endDate : weekEnd;

    const weekDrinks = getDrinksForRange(drinks, actualStart, actualEnd);
    const su = calculateTotalStandardUnits(weekDrinks);
    const grams = calculateTotalAlcoholGrams(weekDrinks);

    const weekNum = getWeek(weekStart, { weekStartsOn: 1 });

    return {
      id: `${getYear(weekStart)}-W${weekNum}`,
      standardUnits: Math.round(su * 10) / 10,
      alcoholGrams: Math.round(grams * 10) / 10,
      label: `W${weekNum}`,
      fullLabel: `KW ${weekNum}: ${format(actualStart, 'd. MMM', { locale: de })} – ${format(actualEnd, 'd. MMM', { locale: de })}`,
      startDate: actualStart,
      endDate: actualEnd,
      drinkCount: weekDrinks.length,
    };
  });

  // X-axis ticks: show month abbreviations at first week of each month
  const xAxisTicks: ChartXAxisTick[] = [];
  let lastMonth = -1;
  bars.forEach((bar, index) => {
    const month = bar.startDate.getMonth();
    if (month !== lastMonth) {
      xAxisTicks.push({
        barIndex: index,
        label: format(bar.startDate, 'MMM', { locale: de }),
      });
      lastMonth = month;
    }
  });

  const maxValue = Math.max(...bars.map(b => b.alcoholGrams), 1);

  return {
    bars,
    xAxisTicks,
    maxValue,
    periodTitle: '6 Monate',
    periodSubtitle: `${format(startDate, 'MMM yyyy', { locale: de })} – ${format(endDate, 'MMM yyyy', { locale: de })}`,
  };
}

/**
 * Generate chart data for yearly view (12 bars, one per month)
 */
function generateYearlyChartData(
  drinks: DrinkEntry[],
  startDate: Date,
  endDate: Date
): ChartData {
  const bars: ChartBarData[] = [];
  const monthLabels = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

  for (let month = 0; month < 12; month++) {
    const monthStart = new Date(startDate.getFullYear(), month, 1);
    const monthEnd = endOfMonth(monthStart);

    const monthDrinks = getDrinksForRange(drinks, monthStart, monthEnd);
    const su = calculateTotalStandardUnits(monthDrinks);
    const grams = calculateTotalAlcoholGrams(monthDrinks);

    bars.push({
      id: format(monthStart, 'yyyy-MM'),
      standardUnits: Math.round(su * 10) / 10,
      alcoholGrams: Math.round(grams * 10) / 10,
      label: monthLabels[month],
      fullLabel: format(monthStart, 'MMMM yyyy', { locale: de }),
      startDate: monthStart,
      endDate: monthEnd,
      drinkCount: monthDrinks.length,
    });
  }

  // X-axis ticks: show all month letters
  const xAxisTicks: ChartXAxisTick[] = bars.map((bar, index) => ({
    barIndex: index,
    label: bar.label,
  }));

  const maxValue = Math.max(...bars.map(b => b.alcoholGrams), 1);

  return {
    bars,
    xAxisTicks,
    maxValue,
    periodTitle: startDate.getFullYear().toString(),
    periodSubtitle: 'Jahresübersicht',
  };
}

/**
 * Generate chart data based on period type
 */
function generateChartData(
  drinks: DrinkEntry[],
  periodType: ChartPeriodType,
  startDate: Date,
  endDate: Date
): ChartData {
  switch (periodType) {
    case 'day':
      return generateDailyChartData(drinks, startDate);
    case 'week':
      return generateWeeklyChartData(drinks, startDate, endDate);
    case 'month':
      return generateMonthlyChartData(drinks, startDate, endDate);
    case 'sixMonth':
      return generateSixMonthChartData(drinks, startDate, endDate);
    case 'year':
      return generateYearlyChartData(drinks, startDate, endDate);
  }
}

export const useStatisticsStore = create<StatisticsState>((set, get) => ({
  periodType: 'week',
  periodOffset: 0,
  stats: null,
  chartData: null,
  isLoading: false,
  profile: null,
  selectedBarIndex: null,

  setPeriodType: (type: ChartPeriodType) => {
    set({ periodType: type, periodOffset: 0, selectedBarIndex: null });
    get().loadStats();
  },

  navigatePeriod: (direction: 'prev' | 'next') => {
    const { periodOffset } = get();
    const newOffset = direction === 'prev' ? periodOffset - 1 : periodOffset + 1;
    // Don't allow navigating into the future
    if (newOffset > 0) return;
    set({ periodOffset: newOffset, selectedBarIndex: null });
    get().loadStats();
  },

  goToCurrentPeriod: () => {
    set({ periodOffset: 0, selectedBarIndex: null });
    get().loadStats();
  },

  selectBar: (index: number | null) => {
    set({ selectedBarIndex: index });
  },

  loadStats: async () => {
    set({ isLoading: true });

    try {
      const profile = await getUserProfile();
      if (!profile) {
        set({ isLoading: false, stats: null, chartData: null });
        return;
      }

      const { periodType, periodOffset } = get();
      const { startDate, endDate } = calculatePeriodBoundaries(periodType, periodOffset);

      // Fetch drinks, goals, and sessions in parallel
      // Sessions are fetched to get accurate peak BAC (sessions that STARTED in the period)
      const [drinks, goals, sessions] = await Promise.all([
        getDrinkEntriesForRange(startDate, endDate),
        getDailyGoalsForRange(startDate, endDate),
        getSessionsForDateRange(startDate, endDate),
      ]);

      // Pass sessions to calculatePeriodStats for session-based peak BAC
      const stats = calculatePeriodStats(drinks, goals, profile, startDate, endDate, sessions);
      const chartData = generateChartData(drinks, periodType, startDate, endDate);

      set({
        stats,
        chartData,
        profile,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to load statistics:', error);
      set({ isLoading: false });
    }
  },
}));

// Subscribe to drink data changes to keep statistics in sync
drinkDataEvents.on('drinksChanged', () => {
  useStatisticsStore.getState().loadStats();
});

drinkDataEvents.on('goalsChanged', () => {
  useStatisticsStore.getState().loadStats();
});
