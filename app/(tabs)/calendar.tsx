import React, { useCallback, useState, useMemo } from 'react';
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
import { format, isToday, startOfMonth, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../src/ui/theme';
import { DayDetailSheet } from '../../src/ui/sheets/DayDetailSheet';
import { useCalendarStore } from '../../src/ui/hooks/useCalendarStore';
import { DayStatus } from '../../src/domain/models/types';
import { YearView } from '../../src/ui/components/YearView';
import { CalendarLegend, DayStats } from '../../src/ui/components/CalendarLegend';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const statusColors: Record<DayStatus, string> = {
  good: colors.soberSoft,
  moderate: colors.moderateSoft,
  bad: colors.overLimitSoft,
  no_data: colors.transparent,
};

const statusColorsToday: Record<DayStatus, string> = {
  good: colors.sober,
  moderate: colors.moderate,
  bad: colors.overLimit,
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
    goToPreviousMonth,
    goToNextMonth,
    navigateToMonth,
    navigateToYear,
    setYear,
    refresh,
  } = useCalendarStore();

  const [dayDetailOpen, setDayDetailOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');

  useFocusEffect(
    useCallback(() => {
      loadMonthData();
    }, [loadMonthData])
  );

  const handleDayPress = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    if (selectedDate === dateStr && !dayDetailOpen) {
      // Force re-trigger by clearing and re-setting
      setSelectedDate('');
      setTimeout(() => {
        setSelectedDate(dateStr);
        setDayDetailOpen(true);
      }, 0);
    } else {
      setSelectedDate(dateStr);
      setDayDetailOpen(true);
    }
  };

  const handleDayDetailClose = () => {
    setDayDetailOpen(false);
  };

  const firstDayOfMonth = startOfMonth(new Date(selectedYear, selectedMonth - 1));
  const firstDayWeekday = getDay(firstDayOfMonth);
  const paddingDays = firstDayWeekday === 0 ? 6 : firstDayWeekday - 1;

  const monthStats = useMemo((): DayStats => {
    let good = 0;
    let moderate = 0;
    let bad = 0;
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    monthDays.forEach((day) => {
      if (day.date > today) return;
      switch (day.status) {
        case 'good': good++; break;
        case 'moderate': moderate++; break;
        case 'bad': bad++; break;
      }
    });

    return { good, moderate, bad, total: good + moderate + bad };
  }, [monthDays]);

  if (viewMode === 'year') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <YearView year={selectedYear} onMonthPress={navigateToMonth} onYearChange={setYear} />
      </SafeAreaView>
    );
  }

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
          <Text style={styles.monthTitleLarge}>
            {format(new Date(selectedYear, selectedMonth - 1), 'MMMM', { locale: enUS })}
          </Text>
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
          <View style={styles.weekdayRow}>
            {WEEKDAYS.map((day, index) => (
              <View key={index} style={styles.weekdayCell}>
                <Text style={styles.weekdayText}>{day}</Text>
              </View>
            ))}
          </View>

          {isLoading && monthDays.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <View style={styles.calendarGrid}>
              {Array.from({ length: paddingDays }).map((_, index) => (
                <View key={`pad-${index}`} style={styles.dayCell} />
              ))}

              {monthDays.map((day) => {
                const isTodayDate = isToday(day.date);
                const today = new Date();
                today.setHours(23, 59, 59, 999);
                const isFutureDate = day.date > today;

                return (
                  <TouchableOpacity
                    key={day.dateString}
                    style={[styles.dayCell, isTodayDate && styles.todayCell]}
                    onPress={isFutureDate ? undefined : () => handleDayPress(day.date)}
                    disabled={isFutureDate}
                    activeOpacity={isFutureDate ? 1 : 0.7}
                  >
                    <Text style={[styles.dayText, isTodayDate && styles.todayText, isFutureDate && styles.futureDayText]}>
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

        <CalendarLegend stats={monthStats} showCounts={true} />
      </ScrollView>

      <DayDetailSheet
        open={dayDetailOpen}
        onClose={handleDayDetailClose}
        date={selectedDate}
        onRefresh={refresh}
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
    shadowColor: colors.shadow,
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
});
