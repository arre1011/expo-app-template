import React, { memo, useCallback, useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { colors, spacing, fontSize, fontWeight } from '../theme';
import { MiniMonth } from './MiniMonth';
import { CalendarLegend, DayStats } from './CalendarLegend';
import { DayStatus, MoodType } from '../../domain/models/types';
import { getJournalEntriesForYear } from '../../data/repositories/journalEntryRepository';

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
      const entries = await getJournalEntriesForYear(year);
      const statusMap = new Map<string, DayStatus>();

      for (const entry of entries) {
        if (entry.mood) {
          statusMap.set(entry.date, entry.mood as DayStatus);
        }
      }

      setDayStatusMap(statusMap);
    } catch (error) {
      console.error('Failed to load year data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [year]);

  useEffect(() => {
    loadYearData();
  }, [loadYearData]);

  const stats = useMemo((): DayStats => {
    let good = 0;
    let moderate = 0;
    let bad = 0;
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    dayStatusMap.forEach((status, dateString) => {
      const date = new Date(dateString);
      if (date > today) return;

      switch (status) {
        case 'good': good++; break;
        case 'moderate': moderate++; break;
        case 'bad': bad++; break;
      }
    });

    return { good, moderate, bad, total: good + moderate + bad };
  }, [dayStatusMap]);

  const handlePreviousYear = useCallback(() => onYearChange(year - 1), [year, onYearChange]);
  const handleNextYear = useCallback(() => onYearChange(year + 1), [year, onYearChange]);

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const rows = [months.slice(0, 3), months.slice(3, 6), months.slice(6, 9), months.slice(9, 12)];

  return (
    <View style={styles.container}>
      <View style={styles.yearHeader}>
        <TouchableOpacity onPress={handlePreviousYear} style={styles.navButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.yearTitle}>{year}</Text>
        <TouchableOpacity onPress={handleNextYear} style={styles.navButton}>
          <Ionicons name="chevron-forward" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
        <CalendarLegend stats={stats} showCounts={true} />
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  yearHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  navButton: { padding: spacing.sm },
  yearTitle: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  scrollView: { flex: 1 },
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
