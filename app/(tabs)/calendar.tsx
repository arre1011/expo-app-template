import React, { useCallback, useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { format, isToday, startOfMonth, getDay, parseISO, isSameDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../src/ui/theme';
import { DayDetailSheet, DayDetailData } from '../../src/ui/sheets';
import { useCalendarStore } from '../../src/ui/hooks/useCalendarStore';
import { useAwardsStore, usePendingCelebration } from '../../src/ui/hooks/useAwardsStore';
import { DayStatus } from '../../src/domain/models/types';
import { getSessionsWithDrinksStartedOnDate } from '../../src/data/repositories/sessionRepository';
import { getDailyGoalForDate } from '../../src/data/repositories/dailyGoalRepository';
import { getUserProfile } from '../../src/data/repositories/userProfileRepository';
import { getJournalEntryForDate } from '../../src/data/repositories/journalEntryRepository';
import { calculateBACTimeSeries } from '../../src/domain/services/bacCalculator';
import { drinkDataEvents } from '../../src/ui/hooks/drinkDataEvents';
import { YearView } from '../../src/ui/components/YearView';
import { CalendarLegend, DayStats } from '../../src/ui/components/CalendarLegend';
import { AwardsSection, CelebrationModal } from '../../src/ui/components';
import { featureFlags } from '../../src/config/featureFlags';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const statusColors: Record<DayStatus, string> = {
  sober: colors.soberSoft,
  moderate: colors.moderateSoft,
  over_limit: colors.overLimitSoft,
  no_data: colors.transparent,
};

// Full opacity colors for today (transparent colors look wrong on dark background)
const statusColorsToday: Record<DayStatus, string> = {
  sober: colors.sober,
  moderate: colors.moderate,
  over_limit: colors.overLimit,
  no_data: colors.transparent,
};

export default function CalendarScreen() {
  const {
    viewMode,
    selectedYear,
    selectedMonth,
    monthDays,
    isLoading,
    loadMonthData,
    selectDay,
    goToPreviousMonth,
    goToNextMonth,
    navigateToMonth,
    navigateToYear,
    setYear,
  } = useCalendarStore();

  // Awards store (only used if feature is enabled)
  const initializeAwards = useAwardsStore(state => state.initialize);
  const dismissCelebration = useAwardsStore(state => state.dismissCelebration);
  const pendingCelebration = usePendingCelebration();

  // Day detail sheet state
  const [dayDetailOpen, setDayDetailOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [dayData, setDayData] = useState<DayDetailData | null>(null);
  const [isDayDataLoading, setIsDayDataLoading] = useState(false);

  // Initialize awards on mount (only if feature is enabled)
  useEffect(() => {
    if (featureFlags.awardsSection) {
      initializeAwards();
    }
  }, [initializeAwards]);

  // Load day data for the sheet
  const loadDayData = useCallback(async (dateString: string): Promise<DayDetailData> => {
    const targetDate = parseISO(dateString);

    const [sessionsData, goalData, profileData, journalData] = await Promise.all([
      getSessionsWithDrinksStartedOnDate(targetDate),
      getDailyGoalForDate(targetDate),
      getUserProfile(),
      getJournalEntryForDate(targetDate),
    ]);

    // Process sessions to add display data
    let sessions: DayDetailData['sessions'] = [];
    if (profileData && sessionsData.length > 0) {
      sessions = sessionsData.map(session => {
        const timeSeries = calculateBACTimeSeries(session.drinks, profileData);
        const startDate = new Date(session.startTime);
        const soberTime = timeSeries.soberTime;
        const isOvernight = soberTime ? !isSameDay(startDate, soberTime) : false;
        const soberDateLabel = isOvernight && soberTime
          ? format(soberTime, 'MMM d', { locale: enUS })
          : null;

        return {
          session,
          timeSeries,
          isOvernight,
          soberDateLabel,
        };
      });
    }

    return {
      sessions,
      goal: goalData,
      journalEntry: journalData,
    };
  }, []);

  // Load data when screen gains focus (handles tab switches)
  useFocusEffect(
    useCallback(() => {
      loadMonthData();
    }, [loadMonthData])
  );

  // Subscribe to drink/session changes to refresh day data if sheet is open
  useEffect(() => {
    if (!dayDetailOpen || !selectedDate) return;

    const refreshDayData = async () => {
      const data = await loadDayData(selectedDate);
      setDayData(data);
    };

    drinkDataEvents.on('drinksChanged', refreshDayData);
    drinkDataEvents.on('sessionsChanged', refreshDayData);

    return () => {
      drinkDataEvents.off('drinksChanged', refreshDayData);
      drinkDataEvents.off('sessionsChanged', refreshDayData);
    };
  }, [dayDetailOpen, selectedDate, loadDayData]);

  const handleDayPress = async (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    selectDay(date);
    setSelectedDate(dateString);
    setIsDayDataLoading(true);

    try {
      // Load data BEFORE opening the sheet
      const data = await loadDayData(dateString);
      setDayData(data);
      // Only open sheet after data is loaded
      setDayDetailOpen(true);
    } catch (error) {
      console.error('Failed to load day data:', error);
    } finally {
      setIsDayDataLoading(false);
    }
  };

  const handleDayDetailClose = () => {
    setDayDetailOpen(false);
    // Note: Calendar refresh happens automatically via drinkDataEvents subscription
    // in useCalendarStore when drinks are added/edited
  };

  const handleDayDataRefresh = useCallback(async () => {
    if (!selectedDate) return;
    const data = await loadDayData(selectedDate);
    setDayData(data);
  }, [selectedDate, loadDayData]);

  // Calculate padding days for calendar grid
  const firstDayOfMonth = startOfMonth(new Date(selectedYear, selectedMonth - 1));
  const firstDayWeekday = getDay(firstDayOfMonth);
  // Adjust for Monday start (0 = Monday, 6 = Sunday)
  const paddingDays = firstDayWeekday === 0 ? 6 : firstDayWeekday - 1;

  // Calculate monthly statistics (excluding future days)
  const monthStats = useMemo((): DayStats => {
    let sober = 0;
    let moderate = 0;
    let overLimit = 0;
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    monthDays.forEach((day) => {
      // Skip future days (they don't have status anyway, but double-check)
      if (day.date > today) {
        return;
      }

      switch (day.status) {
        case 'sober':
          sober++;
          break;
        case 'moderate':
          moderate++;
          break;
        case 'over_limit':
          overLimit++;
          break;
      }
    });

    return {
      sober,
      moderate,
      overLimit,
      total: sober + moderate + overLimit,
    };
  }, [monthDays]);

  // Render Year View
  if (viewMode === 'year') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <YearView
          year={selectedYear}
          onMonthPress={navigateToMonth}
          onYearChange={setYear}
        />
      </SafeAreaView>
    );
  }

  // Render Month View
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header with Back to Year */}
        <View style={styles.header}>
          <TouchableOpacity onPress={navigateToYear} style={styles.backButton}>
            <Ionicons name="chevron-back" size={20} color={colors.text} />
            <Text style={styles.backButtonText}>{selectedYear}</Text>
          </TouchableOpacity>
        </View>

        {/* Month Title with Navigation */}
        <View style={styles.monthHeader}>
          <Text style={styles.monthTitleLarge}>{format(new Date(selectedYear, selectedMonth - 1), 'MMMM', { locale: enUS })}</Text>
          <View style={styles.monthNavButtons}>
            <TouchableOpacity onPress={goToPreviousMonth} style={styles.monthNavButton}>
              <Ionicons name="chevron-back" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={goToNextMonth} style={styles.monthNavButton}>
              <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Calendar Card */}
        <View style={styles.calendarCard}>
          {/* Weekday Headers */}
          <View style={styles.weekdayRow}>
            {WEEKDAYS.map((day, index) => (
              <View key={index} style={styles.weekdayCell}>
                <Text style={styles.weekdayText}>{day}</Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid - show loading only if no data yet */}
          {isLoading && monthDays.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <View style={styles.calendarGrid}>
              {/* Padding days */}
              {Array.from({ length: paddingDays }).map((_, index) => (
                <View key={`pad-${index}`} style={styles.dayCell} />
              ))}

              {/* Actual days */}
              {monthDays.map((day) => {
                const isTodayDate = isToday(day.date);
                // Check if date is in the future
                const today = new Date();
                today.setHours(23, 59, 59, 999);
                const isFutureDate = day.date > today;

                return (
                  <TouchableOpacity
                    key={day.dateString}
                    style={[
                      styles.dayCell,
                      isTodayDate && styles.todayCell,
                    ]}
                    onPress={isFutureDate ? undefined : () => handleDayPress(day.date)}
                    disabled={isFutureDate}
                    activeOpacity={isFutureDate ? 1 : 0.7}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        isTodayDate && styles.todayText,
                        isFutureDate && styles.futureDayText,
                      ]}
                    >
                      {format(day.date, 'd')}
                    </Text>
                    {day.status !== 'no_data' && !isFutureDate && (
                      <View
                        style={[
                          styles.statusDot,
                          { backgroundColor: isTodayDate ? statusColorsToday[day.status] : statusColors[day.status] },
                        ]}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Legend with Statistics */}
        <CalendarLegend stats={monthStats} showCounts={true} />

        {/* Awards Section (behind feature flag) */}
        {featureFlags.awardsSection && (
          <View style={styles.awardsContainer}>
            <AwardsSection />
          </View>
        )}
      </ScrollView>

      {/* Celebration Modal for New Milestones (behind feature flag) */}
      {featureFlags.awardsSection && (
        <CelebrationModal
          milestone={pendingCelebration}
          visible={!!pendingCelebration}
          onDismiss={dismissCelebration}
        />
      )}

      {/* Day Detail Sheet */}
      <DayDetailSheet
        open={dayDetailOpen}
        onClose={handleDayDetailClose}
        date={selectedDate}
        data={dayData}
        onRefresh={handleDayDataRefresh}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingRight: spacing.md,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.full,
    paddingLeft: spacing.sm,
  },
  backButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
    marginLeft: spacing.xs,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  monthTitleLarge: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  monthNavButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  monthNavButton: {
    padding: spacing.sm,
  },
  calendarCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  weekdayRow: {
    flexDirection: 'row',
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  weekdayText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  loadingContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xs,
  },
  todayCell: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  dayText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  todayText: {
    color: colors.textOnPrimary,
  },
  futureDayText: {
    color: colors.textSecondary,
    opacity: 0.4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
  },
  awardsContainer: {
    marginTop: spacing.lg,
  },
});
