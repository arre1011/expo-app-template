import React, { memo, useCallback, useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { colors, spacing, fontSize, fontWeight } from '../theme';
import { MiniMonth } from './MiniMonth';
import { CalendarLegend, DayStats } from './CalendarLegend';
import { DayStatus } from '../../domain/models/types';
import { getSessionsForYear } from '../../data/repositories/sessionRepository';
import { getDailyGoalsForYear } from '../../data/repositories/dailyGoalRepository';
import { getEarliestDrinkTimestamp } from '../../data/repositories/drinkEntryRepository';
import { getUserProfile } from '../../data/repositories/userProfileRepository';
import { getDayStatusBySession } from '../../domain/services/statistics';
import { drinkDataEvents } from '../hooks/drinkDataEvents';

interface YearViewProps {
  year: number;
  onMonthPress: (month: number) => void;
  onYearChange: (year: number) => void;
}

export const YearView = memo(function YearView({
  year,
  onMonthPress,
  onYearChange,
}: YearViewProps) {
  const [dayStatusMap, setDayStatusMap] = useState<Map<string, DayStatus>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const loadYearData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sessions, goals, earliestDrinkTimestamp, profile] = await Promise.all([
        getSessionsForYear(year),
        getDailyGoalsForYear(year),
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

      // Convert sessions to SessionInfo for status calculation
      const sessionInfos = sessions.map(s => ({
        startTime: s.startTime,
        peakBAC: s.peakBAC,
      }));

      // Build day status map for the entire year
      const statusMap = new Map<string, DayStatus>();

      // Process each day of the year
      for (let month = 1; month <= 12; month++) {
        const daysInMonth = new Date(year, month, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(year, month - 1, day);
          const dateString = format(date, 'yyyy-MM-dd');
          const dayGoal = goals.find(g => g.date === dateString) || null;
          const status = getDayStatusBySession(sessionInfos, dayGoal, date, journeyStartDate);

          if (status !== 'no_data') {
            statusMap.set(dateString, status);
          }
        }
      }

      setDayStatusMap(statusMap);
    } catch (error) {
      console.error('Failed to load year data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [year]);

  // Load year data on mount and when year changes
  useEffect(() => {
    loadYearData();
  }, [loadYearData]);

  // Refresh when drinks or sessions change
  useEffect(() => {
    const refresh = () => { loadYearData(); };
    drinkDataEvents.on('drinksChanged', refresh);
    drinkDataEvents.on('sessionsChanged', refresh);
    drinkDataEvents.on('goalsChanged', refresh);
    return () => {
      drinkDataEvents.off('drinksChanged', refresh);
      drinkDataEvents.off('sessionsChanged', refresh);
      drinkDataEvents.off('goalsChanged', refresh);
    };
  }, [loadYearData]);

  // Calculate statistics from dayStatusMap (excluding future days)
  const stats = useMemo((): DayStats => {
    let sober = 0;
    let moderate = 0;
    let overLimit = 0;
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    dayStatusMap.forEach((status, dateString) => {
      // Parse date and check if it's not in the future
      const date = new Date(dateString);
      if (date > today) {
        return; // Skip future days
      }

      switch (status) {
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
  }, [dayStatusMap]);

  const handlePreviousYear = useCallback(() => {
    onYearChange(year - 1);
  }, [year, onYearChange]);

  const handleNextYear = useCallback(() => {
    onYearChange(year + 1);
  }, [year, onYearChange]);

  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  // Split months into rows of 3
  const rows = [
    months.slice(0, 3),
    months.slice(3, 6),
    months.slice(6, 9),
    months.slice(9, 12),
  ];

  return (
    <View style={styles.container}>
      {/* Year Header */}
      <View style={styles.yearHeader}>
        <TouchableOpacity onPress={handlePreviousYear} style={styles.navButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.yearTitle}>{year}</Text>
        <TouchableOpacity onPress={handleNextYear} style={styles.navButton}>
          <Ionicons name="chevron-forward" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Months Grid */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((month) => (
              <MiniMonth
                key={month}
                year={year}
                month={month}
                dayData={dayStatusMap}
                onPress={() => onMonthPress(month)}
                isCurrentMonth={year === currentYear && month === currentMonth}
              />
            ))}
          </View>
        ))}

        {/* Legend with Statistics */}
        <CalendarLegend stats={stats} showCounts={true} />
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  yearHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  navButton: {
    padding: spacing.sm,
  },
  yearTitle: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
});
